import Document, { Head, Main, NextScript } from 'next/document'
import postcss from 'postcss'
import cssnano from 'cssnano'

import { ServerStyleSheets } from '@material-ui/styles'

import theme from '../theme'
import { Fragment } from 'react'

const minifier = postcss([cssnano])

class MyDocument extends Document {
  render() {
    return (
      <html lang="de">
        <Head>
          <meta charSet="utf-8" />
          {/* Use minimum-scale=1 to enable GPU rasterization */}
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
          />
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          {/* TODO can be removed after the redesign of the query tool UI */}
          <script src="https://unpkg.com/prettier@1.19.1/standalone.js" />
          <script src="https://unpkg.com/prettier@1.19.1/parser-graphql.js" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}

MyDocument.getInitialProps = async ctx => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets()
  const originalRenderPage = ctx.renderPage

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props => sheets.collect(<App {...props} />)
    })

  const initialProps = await Document.getInitialProps(ctx)

  let css = sheets.toString()

  if (process.env.NODE_ENV === 'production') {
    css = await minifier.process(css)
  }

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      <Fragment key="styles">
        {initialProps.styles}
        <style
          id="jss-server-side"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: css }}
        />
      </Fragment>
    ]
  }
}

export default MyDocument
