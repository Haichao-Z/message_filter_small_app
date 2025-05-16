// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  const { openid, sender, content, notificationId, templateId } = event;
  
  if (!openid || !sender || !content || !templateId) {
    return {
      success: false,
      error: '参数不完整'
    };
  }
  
  try {
    // 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: templateId,
      page: `pages/history/history?id=${notificationId || ''}`,
      data: {
        thing1: {
          value: '重要联系人通知'
        },
        name2: {
          value: sender
        },
        thing3: {
          value: content.length > 20 ? content.substring(0, 17) + '...' : content
        },
        time4: {
          value: new Date().toLocaleString()
        }
      }
    });
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error
    };
  }
};