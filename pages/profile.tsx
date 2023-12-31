import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import axiosAPI from '@/utils/axios'
import { getLocalStorage } from '@/utils'

const Profile = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams?.get('code') ?? ''

  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [token, setToken] = useState<{ access_token: string; refresh_token: string }>({
    access_token: '',
    refresh_token: '',
  })
  useEffect(() => {
    if (!window) return
    const baseURL = getLocalStorage('oauth2_api_2', 'API_URL')
    const clientID = getLocalStorage('client_id_2', 'OAUTH_CLIENT_ID')
    const clientSecret = getLocalStorage('client_secret_2', 'OAUTH_CLIENT_SECRET')
    const redirectURI = getLocalStorage('redirect_uri_2', 'OAUTH_REDIRECT_URI')
    axiosAPI.defaults.baseURL = baseURL

    console.log('useEffect', code)
    if (code) {
      axiosAPI
        .post<{ data: TokenType }>('/api/v1/oauth2/token', {
          code: code,
          grant_type: 'authorization_code',
          client_id: clientID,
          client_secret: clientSecret,
          redirect_uri: redirectURI,
        })
        .then((res) => {
          if (res.status !== 200) {
            console.log(res)
          } else {
            Cookies.set('access_token', res.data.data.access_token)
            Cookies.set('refresh_token', res.data.data.refresh_token)
            router.replace('/profile')
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  useEffect(() => {
    if (!window) return
    const accessToken = Cookies.get('access_token') ?? ''
    const refreshToken = Cookies.get('refresh_token') ?? ''
    axiosAPI.defaults.baseURL = getLocalStorage('oauth2_api_2', 'API_URL')

    if (!accessToken && !refreshToken) return
    setToken({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    axiosAPI.get<{ data: ProfileType }>(`/api/v1/customer/profile`).then((res) => {
      if (res.status !== 200) {
        console.log(res)
        return
      }
      setProfile(res.data.data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Cookies.get('access_token')])

  const handleSignOut = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setToken({
      access_token: '',
      refresh_token: '',
    })
    router.push('/')
  }

  return profile ? (
    <div className="container mx-auto px-4">
      <div className="grid place-items-center">
        <div className="bg-slate-100 mt-8 p-8 dark:bg-slate-800 grid place-items-center">
          <h2>Auth</h2>
          <div className="w-96 text-ellipsis ">
            <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Access Token
            </label>
            <textarea
              id="message"
              rows={4}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={token.access_token}
            ></textarea>

            <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Refresh Token
            </label>
            <textarea
              id="message"
              rows={1}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={token.refresh_token}
            ></textarea>
            {/* <p>Refresh Token: {token.refresh_token}</p> */}
          </div>
          <br />
          <button
            type="button"
            className="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 mr-2 mb-2"
            onClick={handleSignOut}
          >
            Sign out
          </button>
          <br />
          <h2>Profile</h2>
          <div>
            {profile ? (
              <>
                <p className="w-[360px] truncate">Full name: {profile?.full_name}</p>
                <p>Email: {profile.email || '-'}</p>
                <p>Mobile: {profile.phone_number || '-'}</p>
                <p>Vespisti ID : {profile.vespisti_code}</p>
                <p>
                  Profile image:{' '}
                  {profile.profile_image ? (
                    <img
                      style={{ width: '60px' }}
                      src={profile.profile_image}
                      alt="test"
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null // prevents looping
                        currentTarget.src = '/example.vespistiid/free-no-image-1771002-1505134.webp'
                      }}
                    />
                  ) : null}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  ) : null
}

export default Profile
