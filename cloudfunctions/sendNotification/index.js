// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { openid, sender, content, notificationId, templateId, triggerType } = event;
  
  console.log('接收到发送通知请求:', event);
  
  if (!openid || !sender || !content || !templateId) {
    return {
      success: false,
      error: '参数不完整'
    };
  }
  
  try {
    // 检查接收者的通知设置
    const db = cloud.database();
    const settingsResult = await db.collection('settings')
      .where({ _openid: openid })
      .limit(1)
      .get();
      
    const settings = settingsResult.data.length > 0 ? settingsResult.data[0] : {
      enableNotifications: true,
      notificationSound: true,
      notificationVibration: true
    };
    
    // 如果用户禁用了通知，则不发送
    if (!settings.enableNotifications) {
      return {
        success: false,
        error: '接收者已禁用通知'
      };
    }
    
    // 确保长度符合限制
    const limitedSender = sender.length > 10 ? sender.substring(0, 10) : sender;
    const limitedContent = content.length > 20 ? content.substring(0, 17) + '...' : content;
    
    // 格式化当前时间
    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    console.log('准备发送消息给:', openid);
    console.log('使用模板:', templateId);
    console.log('消息内容:', {
      phrase8: '通知',
      thing2: limitedSender,
      thing4: limitedContent,
      time3: formattedTime
    });
    
    // 先保存通知记录到数据库（如果没有提供notificationId）
    let savedNotificationId = notificationId;
    if (!savedNotificationId) {
      try {
        // 保存通知记录
        const notificationResult = await db.collection('notifications').add({
          data: {
            sender: sender,
            content: content,
            receiverId: openid,
            createdAt: db.serverDate(),
            isRead: false,
            triggerType: triggerType || 'manual' // 标记触发方式
          }
        });
        savedNotificationId = notificationResult._id;
        console.log('通知记录已保存，ID:', savedNotificationId);
      } catch (saveError) {
        console.error('保存通知记录失败:', saveError);
        // 即使保存失败，我们仍继续尝试发送通知
      }
    }
    
    // 确定跳转页面
    let jumpPage = 'pages/history/history';
    if (savedNotificationId) {
      jumpPage = `pages/history/history?id=${savedNotificationId}`;
    }
    
    // 实际发送订阅消息
    const sendResult = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: templateId,
      page: jumpPage,
      data: {
        thing2: {
          value: limitedSender
        },
        time3: {
          value: formattedTime
        },
        thing4: {
          value: limitedContent
        },
        phrase8: {
          value: '通知'
        }
      },
      miniprogramState: 'trial' // 可以根据环境改为 'formal'
    });
    
    console.log('订阅消息发送结果:', sendResult);
    
    // 完全避免使用原始结果对象
    // 只返回一个简单的成功消息
    return {
      success: true,
      message: '消息发送成功',
      errCode: 0,
      notificationId: savedNotificationId // 返回通知ID，以便后续使用
    };
  } catch (error) {
    console.error('发送订阅消息错误:', error);
    return {
      success: false,
      error: error.message || '发送失败'
    };
  }
}