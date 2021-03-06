import router from './router'
import { Route } from 'vue-router'
import { UserModule } from '@/store/modules/userInfo'
import { asyncRoutes, constantRoutes } from '@/router'

// 动态路由匹配（根据业务逻辑而定）
const formatAsyncRoutes = (
  apiRoutes: ApiRoute[],
  asyncRoutes: LocalRoute[]
) => {
  const res: LocalRoute[] = []
  apiRoutes.map(item1 => {
    asyncRoutes.map(item2 => {
      if (item1.path === item2.path) {
        const temp = item2
        if (item1.children && item2.children) {
          temp.children = formatAsyncRoutes(item1.children, item2.children)
        }
        res.push(temp)
      }
    })
  })
  return res
}

const setAsyncRoutes = (apiRoutes: ApiRoute[], asyncRoutes: LocalRoute[]) => {
  const accessRoutes = formatAsyncRoutes(apiRoutes, asyncRoutes)
  accessRoutes.push({ path: '*', redirect: '/404', meta: { hidden: true } })
  router.addRoutes(accessRoutes)
  // 手动添加动态路由（侧边栏使用）
  router.options.routes = constantRoutes.concat(<any[]>accessRoutes)
}

// 在路由上挂载添加动态路由的方法
router.setAsyncRoutes = setAsyncRoutes

router.beforeEach(async (to: Route, from: Route, next: any) => {
  if (to.path === '/login') {
    next()
  } else {
    const hasRoute = UserModule.userInfo.userRoutes.length
    if (hasRoute) {
      next()
    } else {
      // 防止页面刷新数据丢失
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const formatUserInfo: LoginUserInfo = {
          userType: JSON.parse(userInfo).userType,
          userRoutes: JSON.parse(userInfo).dataList
        }
        UserModule.SET_USER_INFO(formatUserInfo)
        setAsyncRoutes(<ApiRoute[]>UserModule.userInfo.userRoutes, asyncRoutes)
        next({ ...to, replace: true })
      } else {
        next('/login')
      }
    }
  }
})
