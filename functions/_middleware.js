// Block developer files from the public Cloudflare Pages deployment.
// Static assets are served by context.next(); only the paths below return 404.
export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  if (pathname === '/README.md' || pathname === '/README' || pathname.startsWith('/.github/')) {
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  return context.next();
}
