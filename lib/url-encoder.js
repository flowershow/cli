// Copy of https://github.com/flowershow/flowershow/blob/main/lib/url-encoder.ts
export function customEncodeUrl(url) {
  return encodeURIComponent(url).replace(/%20/g, "+").replace(/%2F/g, "/");
}
