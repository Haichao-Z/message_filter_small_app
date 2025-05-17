// app.js 文件
App({
    onLaunch: function() {
      // 初始化云开发
      if (wx.cloud) {
        wx.cloud.init({
          env: 'message-filter-5gvcvjz6b029e41e', // 替换为您的云环境ID
          traceUser: true
        });
        
        // 获取用户openid
        this.getOpenid();
      }
    },
    
    // 获取用户openid
    // 获取用户openid
getOpenid: function() {
    const that = this;
    
    console.log('开始获取openid...');
    
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('调用login云函数成功:', res);
        if (res.result && res.result.openid) {
          that.globalData.openid = res.result.openid;
          console.log('获取openid成功: ', res.result.openid);
          
          // 触发openid就绪事件
          if (that.openidReadyCallback) {
            that.openidReadyCallback(res.result.openid);
          }
        } else {
          console.error('login成功但返回数据中没有openid:', res);
        }
      },
      fail: err => {
        console.error('获取openid失败: ', err);
        // 添加重试逻辑
        setTimeout(() => {
          console.log('3秒后重试获取openid...');
          that.getOpenid();
        }, 3000);
      },
      complete: () => {
        console.log('login调用完成');
      }
    });
  },
    
    globalData: {
      openid: null,
      userInfo: null
    },
    
    // 添加此方法，用于其他页面等待openid
    waitForOpenid: function(callback) {
      if (this.globalData.openid) {
        callback(this.globalData.openid);
      } else {
        this.openidReadyCallback = callback;
      }
    }
  });