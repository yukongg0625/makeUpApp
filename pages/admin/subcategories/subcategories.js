// pages/admin/subcategories/subcategories.js
Page({
  data: {
    categories: [],
    subcategories: [],
    categoryNames: [],
    selectedCategoryIndex: -1,
    selectedCategoryName: '全部',
    loading: true,
    showModal: false,
    editMode: false,
    editId: null,
    formData: {
      categoryId: '',
      categoryName: '',
      categoryIndex: -1,
      name: '',
      order: 1
    }
  },

  onLoad: function (options) {
    this.loadCategories()
    this.loadSubcategories()
  },

  loadCategories: function () {
    const db = wx.cloud.database()
    db.collection('categories')
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const categories = res.data
        const categoryNames = categories.map(item => item.name)
        
        this.setData({
          categories: categories,
          categoryNames: categoryNames
        })
      })
      .catch(err => {
        console.error('加载影集失败:', err)
      })
  },

  loadSubcategories: function (categoryId) {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    const _ = db.command
    let query = db.collection('subcategories')
    
    const conditions = {}
    if (categoryId) {
      conditions.categoryId = categoryId
    }
    
    if (Object.keys(conditions).length > 0) {
      query = query.where(conditions)
    }
    
    query.orderBy('order', 'asc')
      .get()
      .then(res => {
        this.setData({
          subcategories: res.data,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载子类失败:', err)
        this.setData({ loading: false })
      })
  },

  onCategoryChange: function (e) {
    const index = parseInt(e.detail.value)
    
    if (index === -1) {
      this.setData({
        selectedCategoryIndex: -1,
        selectedCategoryName: '全部'
      })
      this.loadSubcategories()
    } else {
      const category = this.data.categories[index]
      this.setData({
        selectedCategoryIndex: index,
        selectedCategoryName: category.name
      })
      this.loadSubcategories(category._id)
    }
  },

  onAddSubcategory: function () {
    this.setData({
      showModal: true,
      editMode: false,
      editId: null,
      formData: {
        categoryId: '',
        categoryName: '',
        categoryIndex: -1,
        name: '',
        order: 1
      }
    })
  },

  onEditSubcategory: function (e) {
    const id = e.currentTarget.dataset.id
    const subcategory = this.data.subcategories.find(item => item._id === id)
    
    if (subcategory) {
      const categoryIndex = this.data.categories.findIndex(
        cat => cat._id === subcategory.categoryId
      )
      
      this.setData({
        showModal: true,
        editMode: true,
        editId: id,
        formData: {
          categoryId: subcategory.categoryId,
          categoryName: subcategory.categoryName,
          categoryIndex: categoryIndex,
          name: subcategory.name,
          order: subcategory.order
        }
      })
    }
  },

  onDeleteSubcategory: function (e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteSubcategory(id)
        }
      }
    })
  },

  deleteSubcategory: function (id) {
    wx.showLoading({ title: '删除中...' })
    
    wx.cloud.callFunction({
      name: 'deleteDocument',
      data: {
        collection: 'subcategories',
        id: id
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadSubcategories()
      } else {
        wx.showToast({ title: res.result.message || '删除失败', icon: 'error' })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'error' })
      console.error('删除子类失败:', err)
    })
  },

  onCategoryPickerChange: function (e) {
    const index = parseInt(e.detail.value)
    const category = this.data.categories[index]
    
    this.setData({
      'formData.categoryId': category._id,
      'formData.categoryName': category.name,
      'formData.categoryIndex': index
    })
  },

  onNameInput: function (e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onOrderInput: function (e) {
    const value = e.detail.value
    this.setData({
      'formData.order': value === '' ? '' : (parseInt(value) || 1)
    })
  },

  onSaveSubcategory: function () {
    const { categoryId, categoryName, name, order } = this.data.formData
    
    if (!categoryId) {
      wx.showToast({ title: '请选择所属影集', icon: 'none' })
      return
    }
    
    if (!name) {
      wx.showToast({ title: '请输入子类名称', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const db = wx.cloud.database()
    
    if (this.data.editMode) {
      const oldSubcategory = this.data.subcategories.find(sub => sub._id === this.data.editId)
      const oldName = oldSubcategory ? oldSubcategory.name : ''
      
      console.log('=== 开始更新子类 ===')
      console.log('editId:', this.data.editId)
      console.log('旧名称:', oldName)
      console.log('新名称:', name)
      
      // 使用云函数更新子类（避免权限问题）
      wx.cloud.callFunction({
        name: 'updateSubcategory',
        data: {
          id: this.data.editId,
          categoryId: categoryId,
          categoryName: categoryName,
          name: name,
          order: order
        }
      }).then(res => {
        console.log('=== 云函数更新结果 ===')
        console.log('res:', res)
        
        if (res.result && res.result.success) {
          console.log('=== 更新完成 ===')
          console.log('旧名称:', res.result.data.oldName, '新名称:', res.result.data.newName)
          
          wx.hideLoading()
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.onCloseModal()
          this.loadSubcategories()
        } else {
          wx.hideLoading()
          wx.showToast({ title: res.result.message || '更新失败', icon: 'error' })
        }
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'error' })
        console.error('=== 更新失败 ===')
        console.error('错误详情:', err)
      })
    } else {
      db.collection('subcategories').add({
        data: {
          categoryId: categoryId,
          categoryName: categoryName,
          name: name,
          order: order,
          enabled: true
        }
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.onCloseModal()
        this.loadSubcategories()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '添加失败', icon: 'error' })
        console.error('添加子类失败:', err)
      })
    }
  },

  onCloseModal: function () {
    this.setData({
      showModal: false,
      editMode: false,
      editId: null,
      formData: {
        categoryId: '',
        categoryName: '',
        categoryIndex: -1,
        name: '',
        order: 1
      }
    })
  }
})
