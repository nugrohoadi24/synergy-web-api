import apihelper from './ApiHelper'

export default {

  doLogin (username,password) {
    return apihelper.execute('post', '/auth/login',{
      "username":username,
      "password":password
    });
  },

  getPost (id) {
    return apihelper.execute('get', `/posts/${id}`)
  },

  createPost (data) {
    return apihelper.execute('post', '/posts', data)
  },

  updatePost (id, data) {
    return apihelper.execute('put', `/posts/${id}`, data)
  },
  
  deletePost (id) {
    return apihelper.execute('delete', `/posts/${id}`)
  }
}
