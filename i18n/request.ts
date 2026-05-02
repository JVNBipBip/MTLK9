import { getRequestConfig } from "next-intl/server"
import { headers } from "next/headers"
import { defaultLocale, isAppLocale, localeHeaderName } from "@/lib/i18n/config"
import { getMessages } from "@/lib/i18n/messages"

export default getRequestConfig(async () => {
  const headerStore = await headers()
  const localeFromHeader = headerStore.get(localeHeaderName)
  const locale = isAppLocale(localeFromHeader) ? localeFromHeader : defaultLocale

  return {
    locale,
    messages: getMessages(locale),
  }
})
