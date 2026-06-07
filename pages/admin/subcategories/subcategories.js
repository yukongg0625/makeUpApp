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
      order: 1,
      hidden: false
    }
  },

  onLoad: function (options) {
    this.loadCategories()
    this.loadSubcategories()
  },

  onShow: function () {
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
    let query = db.collection('subcategories')

    if (categoryId) {
      query = query.where({ categoryId: categoryId })
      console.log('loadSubcategories: 按影集筛选，categoryId =', categoryId)
    } else {
      console.log('loadSubcategories: 无筛选条件，查询所有子集（包括隐藏的）')
    }

    query.orderBy('order', 'asc')
      .get()
      .then(res => {
        console.log('loadSubcategories: 查询结果数量 =', res.data.length)
        console.log('loadSubcategories: 子集数据 =', res.data)
        
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
        order: 1,
        hidden: false
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
          order: subcategory.order,
          hidden: subcategory.hidden || false
        }
      })
    }
  },

  onDeleteSubcategory: function (e) {
    const id = e.currentTarget.dataset.id
    const subcategory = this.data.subcategories.find(item => item._id === id)

    wx.showModal({
      title: '确认删除',
      content: `删除"${subcategory ? subcategory.name : '子类'}"将同时删除其下所有作品和图片，确定要删除吗？`,
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
      name: 'cascadeDelete',
      data: {
        action: 'deleteSubcategory',
        subcategoryId: id
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

  onToggleHiddenInForm: function () {
    const currentValue = this.data.formData.hidden
    this.setData({
      'formData.hidden': !currentValue
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
    const { categoryId, categoryName, name, order, hidden } = this.data.formData

    if (!categoryId) {
      wx.showToast({ title: '请选择所属影集', icon: 'none' })
      return
    }

    if (!name) {
      wx.showToast({ title: '请输入子类名称', icon: 'none' })
      return
    }

    const db = wx.cloud.database()
    let checkQuery = db.collection('subcategories').where({
      categoryId: categoryId,
      name: name
    })

    if (this.data.editMode) {
      checkQuery = checkQuery.where({
        _id: db.command.neq(this.data.editId)
      })
    }

    checkQuery.get().then(res => {
      if (res.data.length > 0) {
        wx.showToast({ title: '该影集下已有同名子类', icon: 'none' })
        return
      }

      this.saveSubcategory(categoryId, categoryName, name, order, hidden)
    }).catch(err => {
      console.error('检查子类名称失败:', err)
      wx.showToast({ title: '检查失败', icon: 'none' })
    })
  },

  saveSubcategory: function (categoryId, categoryName, name, order, hidden) {
    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()

    if (this.data.editMode) {
      wx.cloud.callFunction({
        name: 'updateSubcategory',
        data: {
          id: this.data.editId,
          categoryId: categoryId,
          categoryName: categoryName,
          name: name,
          order: order,
          hidden: hidden
        }
      }).then(res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
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
        console.error('更新子类失败:', err)
      })
    } else {
      db.collection('subcategories').add({
        data: {
          categoryId: categoryId,
          categoryName: categoryName,
          name: name,
          order: order,
          hidden: hidden,
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
        order: 1,
        hidden: false
      }
    })
  }
})