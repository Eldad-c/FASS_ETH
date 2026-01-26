'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<'en' | 'am'>('en')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get user's language preference
    const loadLanguagePreference = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('id', user.id)
          .single()
        if (profile?.language_preference) {
          setLanguage(profile.language_preference as 'en' | 'am')
        }
      }
    }
    loadLanguagePreference()
  }, [supabase])

  const handleLanguageChange = async (newLang: 'en' | 'am') => {
    setLanguage(newLang)
    
    // Update user's language preference if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ language_preference: newLang })
        .eq('id', user.id)
    }

    // Store in localStorage for non-logged-in users
    localStorage.setItem('language', newLang)
    
    // Reload page to apply language changes
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          {language === 'en' ? 'English' : 'አማርኛ'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('am')}>
          አማርኛ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
