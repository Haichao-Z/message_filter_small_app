// sendNotification/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { openid, sender, content, notificationId, templateId } = event;
  
  console.log('收到发送通知请求，参数:', event);
  
  if (!openid || !sender || !content || !templateId) {
    console.error('参数不完整');
    return {
      success: false,
      error: '参数不完整'
    };
  }
  
  try {
    console.log('准备发送订阅消息...');
    console.log('接收者openid:', openid);
    console.log('使用模板ID:', templateId);
    
    // 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: templateId,
      page: `pages/history/history?id=${notificationId || ''}`,
      data: {
        // 根据您的模板具体字段修改下面的内容
        thing1: {
          value: '重要联系人通知'
        },
        name2: {
          value: sender.length > 10 ? sender.substring(0, 10) : sender
        },
        thing3: {
          value: content.length > 20 ? content.substring(0, 17) + '...' : content
        },
        time4: {
          value: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }).replace(/\//g, '-')
        }
      },
      miniprogramState: 'formal' // 可选值: developer(开发版), trial(体验版), formal(正式版)
    });
    
    console.log('订阅消息发送结果:', result);
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('发送订阅消息失败:', error);
    return {
      success: false,
      error: error.message || error
    };
  }
};