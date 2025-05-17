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
    isDev: true,  // 开发环境设为true，发布前改为false
    openid: null,  // 添加这一行
    templateId: '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE' // 替换为您申请的订阅消息模板ID
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
    const templateId = '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE'; // 您的模板ID
    
    console.log('请求订阅消息，使用模板ID:', templateId);
    
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息授权结果:', res);
        
        if (res[templateId] === 'accept') {
          // 用户接受了订阅
          wx.showToast({
            title: '订阅成功',
            icon: 'success'
          });
          
          // 保存订阅状态到本地（替代原saveSubscriptionStatus调用）
          this.setData({
            hasSubscribed: true
          });
          
          // 可选：保存到数据库
          this.updateSubscriptionInDatabase(true);
        } else {
          // 用户拒绝了订阅或授权已过期
          console.log('用户拒绝订阅或授权已过期');
          wx.showToast({
            title: '未获得订阅授权',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('订阅消息请求失败:', err);
        wx.showToast({
          title: '订阅请求失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 添加此函数用于更新数据库中的订阅状态（可选）
  updateSubscriptionInDatabase: function(status) {
    const db = wx.cloud.database();
    db.collection('settings').where({
      _openid: getApp().globalData.openid
    }).get().then(res => {
      if (res.data.length > 0) {
        // 更新现有记录
        db.collection('settings').doc(res.data[0]._id).update({
          data: {
            hasSubscribed: status,
            lastSubscribedAt: db.serverDate()
          }
        }).catch(err => console.error('更新订阅状态失败:', err));
      } else {
        // 创建新记录
        db.collection('settings').add({
          data: {
            hasSubscribed: status,
            lastSubscribedAt: db.serverDate(),
            enableNotifications: true,
            notificationSound: true,
            notificationVibration: true
          }
        }).catch(err => console.error('创建设置记录失败:', err));
      }
    }).catch(err => console.error('获取设置记录失败:', err));
  },

  // 测试订阅消息发送
// 测试订阅消息发送
testSubscriptionSend: function() {
    const templateId = '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE'; // 您的模板ID
    
    // 从页面数据中获取openid，而不是从app.globalData中获取
    const openid = this.data.openid;
    
    // 检查openid
    if (!openid) {
      console.error('未获取到openid，当前页面数据:', this.data);
      console.error('app.globalData:', getApp().globalData);
      
      // 尝试重新获取openid
      wx.showLoading({
        title: '正在获取用户ID...',
      });
      
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          wx.hideLoading();
          if (res.result && res.result.openid) {
            const newOpenid = res.result.openid;
            console.log('重新获取openid成功:', newOpenid);
            
            // 更新页面数据和全局数据
            this.setData({ openid: newOpenid });
            getApp().globalData.openid = newOpenid;
            
            // 立即尝试发送测试消息
            this.sendTestMessageWithOpenid(newOpenid, templateId);
          } else {
            wx.showToast({
              title: '获取用户ID失败',
              icon: 'none'
            });
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('调用login云函数失败:', err);
          wx.showToast({
            title: '获取用户ID失败',
            icon: 'none'
          });
        }
      });
      return;
    }
    
    // 使用已有的openid发送测试消息
    this.sendTestMessageWithOpenid(openid, templateId);
  },
  
  // 新增此辅助函数，用于发送测试消息
  sendTestMessageWithOpenid: function(openid, templateId) {
    wx.showLoading({
      title: '发送测试消息...',
    });
    
    console.log('准备发送测试消息, openid:', openid, 'templateId:', templateId);
    
    // 调用云函数发送通知
    wx.cloud.callFunction({
      name: 'sendNotification',
      data: {
        openid: openid,
        sender: '测试发送者',
        content: '这是一条测试订阅消息 ' + new Date().toLocaleTimeString(),
        notificationId: '',
        templateId: templateId
      }
    }).then(res => {
      wx.hideLoading();
      console.log('发送测试消息结果:', res);
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '测试消息已发送',
          icon: 'success'
        });
      } else {
        wx.showModal({
          title: '发送失败',
          content: JSON.stringify(res.result.error || res.result || '未知错误'),
          showCancel: false
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('调用发送云函数失败:', err);
      
      wx.showModal({
        title: '调用失败',
        content: JSON.stringify(err),
        showCancel: false
      });
    });
  },

  onLoad: function() {
    const app = getApp();
    
    // 如果全局已有openid，直接使用
    if (app.globalData.openid) {
      console.log('设置页面：使用全局openid:', app.globalData.openid);
      this.setData({
        openid: app.globalData.openid
      });
    } else {
      // 否则等待openid获取完成
      console.log('设置页面：等待openid...');
      app.waitForOpenid = function(callback) {
        app.openidReadyCallback = callback;
      };
      
      app.waitForOpenid(openid => {
        console.log('设置页面：openid已就绪:', openid);
        this.setData({
          openid: openid
        });
      });
    }
    
    // 获取用户设置
    this.fetchSettings();
  },

  // 在settings.js中添加
checkOpenid: function() {
    const app = getApp();
    const pageOpenid = this.data.openid;
    const globalOpenid = app.globalData.openid;
    
    wx.showModal({
      title: '用户ID状态',
      content: `页面openid: ${pageOpenid || '未设置'}\n全局openid: ${globalOpenid || '未设置'}`,
      showCancel: false,
      success: (res) => {
        if (!pageOpenid && !globalOpenid) {
          // 如果都没有，尝试重新获取
          wx.cloud.callFunction({
            name: 'login',
            success: res => {
              if (res.result && res.result.openid) {
                const newOpenid = res.result.openid;
                app.globalData.openid = newOpenid;
                this.setData({ openid: newOpenid });
                
                wx.showToast({
                  title: '已更新用户ID',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    });
  }
});