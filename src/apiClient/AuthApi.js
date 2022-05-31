import apihelper from './ApiHelper'

export default {

  doLogin (username,password) {
    return apihelper.execute('post', '/auth/login',{
      "username":username,
      "password":password
    });
  },
}
