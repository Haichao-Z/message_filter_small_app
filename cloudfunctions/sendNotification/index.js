// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { openid, sender, content, notificationId, templateId } = event;
  
  console.log('接收到发送通知请求:', event);
  
  if (!openid || !sender || !content || !templateId) {
    return {
      success: false,
      error: '参数不完整'
    };
  }
  
  try {
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
    
    const sendResult = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: templateId,
      page: 'pages/history/history',
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
      miniprogramState: 'developer'
    });
    
    console.log('订阅消息发送结果:', sendResult);
    
    // 完全避免使用原始结果对象
    // 只返回一个简单的成功消息
    return {
      success: true,
      message: '消息发送成功',
      errCode: 0,
      // 不返回原始的msgid，因为它是BigInt
    };
  } catch (error) {
    console.error('发送订阅消息错误:', error);
    return {
      success: false,
      error: error.message || '发送失败'
    };
  }
}