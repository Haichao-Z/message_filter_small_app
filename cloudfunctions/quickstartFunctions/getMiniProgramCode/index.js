// cloudfunctions/quickstartFunctions/getMiniProgramCode/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取小程序二维码云函数入口函数
exports.main = async (event, context) => {
  console.log('收到生成小程序码请求，参数:', event);
  
  try {
    // 允许自定义路径
    const path = event.path || 'pages/index/index';
    console.log('将生成路径:', path);
    
    // 获取小程序二维码的buffer
    const resp = await cloud.openapi.wxacode.get({
      path: path,
      width: 430, // 设置合适的宽度
      auto_color: false,
      line_color: { r: 0, g: 0, b: 0 },
      is_hyaline: false
    });
    
    console.log('生成小程序码成功，准备上传');
    const { buffer } = resp;
    
    // 将图片上传云存储空间
    const upload = await cloud.uploadFile({
      cloudPath: `qrcodes/${Date.now()}.png`,
      fileContent: buffer
    });
    
    console.log('上传成功，fileID:', upload.fileID);
    return upload.fileID;
  } catch (error) {
    console.error('生成小程序码失败:', error);
    return {
      success: false,
      error: error
    };
  }
};