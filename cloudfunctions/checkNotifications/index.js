// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    // 获取所有重要联系人
    const contactsResult = await db.collection('contacts')
      .where({
        _openid: openid,
        isImportant: true
      })
      .get();
    
    const importantContacts = contactsResult.data;
    
    // 获取用户设置
    const settingsResult = await db.collection('settings')
      .where({
        _openid: openid
      })
      .limit(1)
      .get();
    
    const settings = settingsResult.data.length > 0 ? settingsResult.data[0] : {
      enableNotifications: true,
      notificationSound: true,
      notificationVibration: true
    };
    
    return {
      success: true,
      importantContacts,
      settings
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error
    };
  }
};