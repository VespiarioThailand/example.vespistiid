import axios, { AxiosInstance } from 'axios'
import mem from 'mem'
import Cookies from 'js-cookie'
import { getLocalStorage } from '.'

const axiosAPI: AxiosInstance = axios.create({
  // baseURL: getLocalStorage('oauth2_api_2', 'API_URL'),
  // baseURL: getConfig().publicRuntimeConfig['API_URL_UAT'],
  timeout: 10000,
})

const refreshToken = async (refresh_token: string) => {
  const res = await axios.post<RefreshTokenType>(`${axiosAPI.defaults.baseURL}/api/v1/oauth2/token`, {
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    client_id: getLocalStorage('client_id_2', 'OAUTH_CLIENT_ID'),
    client_secret: getLocalStorage('client_secret_2', 'OAUTH_CLIENT_SECRET'),
  })
  if (res.status !== 200) {
    throw new Error('Refresh token failed')
  }
  return res.data.data
}

const memoizedRefreshToken = mem(refreshToken, {
  maxAge: 10000,
})
// Add a request interceptor
axiosAPI.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    const access = Cookies.get('access_token')
    if (!access) {
      return config
    }
    config.headers = config.headers ?? {}
    // Now config.headers can be safely used
    config.headers.Authorization = `Bearer ${access}`

    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// Add a response interceptor
axiosAPI.interceptors.response.use(
  function (response) {
    return response
  },
  async function (error) {
    const config = error?.config
    if (error?.response?.status === 401) {
      config.sent = true

      const refreshToken = Cookies.get('refresh_token')
      if (!refreshToken) {
        return axios(config)
      }

      const data = await memoizedRefreshToken(refreshToken)

      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${data.access_token}`,
      }
      // set cookie
      Cookies.set('access_token', data.access_token)
      Cookies.set('refresh_token', data.refresh_token)
      return axiosAPI(config)
    }
    return error
  },
)

export default axiosAPI
