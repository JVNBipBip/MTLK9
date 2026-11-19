import type { ImageProps } from "next/image"
import { EditableImageClient } from "@/components/editable-image-client"
import type { AppLocale } from "@/lib/i18n/config"
import { imageFields, resolveImage, type ImageFieldId } from "@/lib/site-editing/fields"

type EditableImageProps = Omit<ImageProps, "src" | "alt"> & {
  id: ImageFieldId
  locale: AppLocale
}

/**
 * Owner-replaceable photo, registered in `content/editable-fields.json`.
 * Takes the usual `next/image` props except `src`/`alt`, which come from the
 * registry or his published edit.
 */
export function EditableImage({ id, locale, ...imageProps }: EditableImageProps) {
  const image = resolveImage(id, locale)
  const sizing = imageProps.fill ? {} : { width: image.width ?? imageProps.width, height: image.height ?? imageProps.height }

  return (
    <EditableImageClient
      {...imageProps}
      {...sizing}
      id={id}
      locale={locale}
      src={image.src}
      alt={image.alt}
      aspect={imageFields[id].aspect}
    />
  )
}
