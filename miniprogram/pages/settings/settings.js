const app = getApp();
const db = wx.cloud.database();
const settingsCollection = db.collection('settings');

Page({
  data: {
    settings: {
      enableNotifications: true,
      notificationSound: true,
      notificationVibration: true
    },
    isLoading: true,
    templateId: '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE' // 替换为您申请的订阅消息模板ID
  },
  
  onLoad: function() {
    this.fetchSettings();
  },
  
  // 获取用户设置
  fetchSettings: function() {
    const that = this;
    that.setData({ isLoading: true });
    
    settingsCollection.where({
      _openid: app.globalData.openid || ''
    }).get().then(res => {
      if (res.data.length > 0) {
        that.setData({
          settings: res.data[0],
          isLoading: false
        });
      } else {
        // 创建默认设置
        that.createDefaultSettings();
      }
    }).catch(err => {
      console.error('获取设置失败：', err);
      that.setData({ isLoading: false });
      wx.showToast({
        title: '获取设置失败',
        icon: 'none'
      });
    });
  },
  
  // 创建默认设置
  createDefaultSettings: function() {
    const defaultSettings = {
      enableNotifications: true,
      notificationSound: true,
      notificationVibration: true
    };
    
    settingsCollection.add({
      data: defaultSettings
    }).then(res => {
      this.setData({
        settings: defaultSettings,
        isLoading: false
      });
    }).catch(err => {
      console.error('创建默认设置失败：', err);
      this.setData({ isLoading: false });
    });
  },
  
  // 更新设置
  updateSettings: function(data) {
    settingsCollection.where({
      _openid: app.globalData.openid || ''
    }).get().then(res => {
      if (res.data.length > 0) {
        // 更新现有设置
        settingsCollection.doc(res.data[0]._id).update({
          data: data
        }).catch(err => {
          console.error('更新设置失败：', err);
        });
      } else {
        // 创建新设置
        settingsCollection.add({
          data: {...this.data.settings, ...data}
        }).catch(err => {
          console.error('创建设置失败：', err);
        });
      }
    });
  },
  
  // 切换通知开关
  toggleNotifications: function(e) {
    const enableNotifications = e.detail.value;
    this.setData({
      'settings.enableNotifications': enableNotifications
    });
    this.updateSettings({ enableNotifications });
  },
  
  // 切换声音开关
  toggleSound: function(e) {
    const notificationSound = e.detail.value;
    this.setData({
      'settings.notificationSound': notificationSound
    });
    this.updateSettings({ notificationSound });
  },
  
  // 切换震动开关
  toggleVibration: function(e) {
    const notificationVibration = e.detail.value;
    this.setData({
      'settings.notificationVibration': notificationVibration
    });
    this.updateSettings({ notificationVibration });
  },
  
  // 请求订阅消息授权
  requestSubscription: function() {
    wx.requestSubscribeMessage({
      tmplIds: [this.data.templateId],
      success: (res) => {
        if (res[this.data.templateId] === 'accept') {
          wx.showToast({
            title: '订阅成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '订阅失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('订阅消息请求失败：', err);
        wx.showToast({
          title: '订阅请求失败',
          icon: 'none'
        });
      }
    });
  }
});