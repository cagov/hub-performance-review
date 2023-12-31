import arc from '@architect/functions';

export async function handler (req) {
  // see https://arc.codes/docs/en/reference/runtime-helpers/node.js#arc.events

  // if key 'site' is in req.params, then

  // supposed to work based on my read of docs, but does not work
  // if ('site' in req.query && req.query.site === 'hub.innovation.ca.gov') {
  if (req.queryStringParameters && req.queryStringParameters.site==='hub.innovation.ca.gov') {
    let sitedomain = 'hub.innovation.ca.gov';
    let data = await arc.tables();
    let result = await data.evaluations.query({
      KeyConditionExpression: 'sitedomain = :sitedomain',
      ExpressionAttributeValues: {
        ':sitedomain': sitedomain
      }
    })
    return {
      statusCode: 200,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'content-type': 'application/json; charset=utf8'
      },
      body:JSON.stringify(result.Items)
    }

  } else {

    return {
      statusCode: 200,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'content-type': 'text/html; charset=utf8'
      },
      body: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>CA.gov site performance review tool</title>
        </head>
        <body>
          <h1 class="margin-bottom-16">
            Site performance review function
          </h1>
          <p class="margin-bottom-8">
            View documentation at:
          </p>
          <code>
            <a class="color-grey color-black-link" href="https://github.com/cagov/site-performance-review">https://github.com/cagov/hub-performance-review</a>
          </code>
        </body>
        </html>
      `
    }
  }
}