'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [info, setInfo] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const checks: any = {
        env: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        checks.user = {
          exists: !!user,
          id: user?.id,
          email: user?.email,
          error: userError?.message,
        }

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          checks.profile = {
            exists: !!profile,
            data: profile,
            error: profileError?.message,
          }
        }

        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('count')
          .limit(1)

        checks.cabins = {
          accessible: !cabinsError,
          error: cabinsError?.message,
        }
      } catch (err: any) {
        checks.error = err.message
      }

      setInfo(checks)
    }

    check()
  }, [supabase])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(info, null, 2)}
      </pre>
      <div className="mt-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
