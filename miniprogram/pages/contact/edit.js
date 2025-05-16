const app = getApp();
const db = wx.cloud.database();
const contactsCollection = db.collection('contacts');

Page({
  data: {
    contactId: '',
    contactName: '',
    isImportant: true
  },
  
  onLoad: function(options) {
    if (options.id) {
      this.setData({ contactId: options.id });
      this.fetchContactDetails(options.id);
    }
  },
  
  // 获取联系人详情
  fetchContactDetails: function(id) {
    wx.showLoading({
      title: '加载中...',
    });
    
    contactsCollection.doc(id).get().then(res => {
      wx.hideLoading();
      const contact = res.data;
      this.setData({
        contactName: contact.name,
        isImportant: contact.isImportant
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('获取联系人详情失败：', err);
      wx.showToast({
        title: '获取联系人详情失败',
        icon: 'none'
      });
    });
  },
  
  // 处理名称输入
  onNameInput: function(e) {
    this.setData({
      contactName: e.detail.value
    });
  },
  
  // 切换重要状态
  toggleImportant: function(e) {
    this.setData({
      isImportant: e.detail.value
    });
  },
  
  // 更新联系人
  saveContact: function() {
    const { contactId, contactName, isImportant } = this.data;
    
    // 验证输入
    if (!contactName.trim()) {
      wx.showToast({
        title: '请输入联系人名称',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
    });
    
    // 更新云数据库
    contactsCollection.doc(contactId).update({
      data: {
        name: contactName.trim(),
        isImportant: isImportant,
        updatedAt: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('更新联系人失败：', err);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    });
  }
});