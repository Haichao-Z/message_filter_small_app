const app = getApp();
const db = wx.cloud.database();
const contactsCollection = db.collection('contacts');

Page({
  data: {
    contactName: '',
    isImportant: true
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
  
  // 保存联系人
  saveContact: function() {
    const { contactName, isImportant } = this.data;
    
    // 验证输入
    if (!contactName.trim()) {
      wx.showToast({
        title: '请输入联系人名称',
        icon: 'none'
      });
      return;
    }
    
    // 保存到云数据库
    contactsCollection.add({
      data: {
        name: contactName.trim(),
        isImportant: isImportant,
        createdAt: db.serverDate()
      }
    }).then(() => {
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      console.error('添加联系人失败：', err);
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    });
  }
});