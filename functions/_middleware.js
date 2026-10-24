// Block developer files from the public Cloudflare Pages deployment.
// Static assets are served by context.next(); only the paths below return 404.
export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  // Google Search Console verification file — served as-is so the clean-URL
  // redirect for *.html does not interfere with Google's check.
  if (pathname === '/googlebfe91605bb5fc7a6.html') {
    return new Response('google-site-verification: googlebfe91605bb5fc7a6.html\n', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  if (pathname === '/README.md' || pathname === '/README' || pathname.startsWith('/.github/')) {
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  return context.next();
}
