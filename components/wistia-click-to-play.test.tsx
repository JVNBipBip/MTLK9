import { renderToStaticMarkup } from "react-dom/server"
import { WistiaClickToPlay } from "@/components/wistia-click-to-play"

describe("WistiaClickToPlay", () => {
  it("renders the native Wistia player inline without autoplay or a modal", () => {
    const html = renderToStaticMarkup(
      <WistiaClickToPlay
        wistiaId="test-video"
        title="Client testimonial"
      />,
    )

    expect(html).toContain('data-video-playback="wistia-embed"')
    expect(html).toContain("aspect-[9/16]")
    expect(html).toContain("autoPlay=false")
    expect(html).toContain("muted=false")
    expect(html).toContain("controlsVisibleOnLoad=true")
    expect(html).toContain("volumeControl=true")
    expect(html).not.toContain("portrait-modal")
    expect(html).not.toContain("role=\"dialog\"")
  })
})
