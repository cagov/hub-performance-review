import arc from '@architect/functions';
import parser from 'xml2json-light';
import fetch from 'node-fetch';

export async function handler (req) {

  let startTime = new Date().getTime();
  console.log(startTime);

  const sitemapResponse = await fetch("https://hub.innovation.ca.gov/sitemap.xml");
  const textData = await sitemapResponse.text();
  
  // xml to json
  var sitemapJSON = parser.xml2json(textData);
   
  console.log(sitemapJSON); 
  
  let data = await arc.tables();

  // gimme a single url at a time in synchronous loop
  for (const page of sitemapJSON.urlset.url) {
    console.log('checking '+page.loc)

		// lookup each url in dynamo db
    let pageURL = page.loc;
    let urlObj = new URL(pageURL);
    let sitedomain = urlObj.host;

    let urlInfo = await data.evaluations.get({pageURL, sitedomain});
    console.log('looked up this in db: '+page.loc);
    if(!urlInfo || urlInfo.lastmod !== page.lastmod) {

      let fetchUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=accessibility&category=performance&url=${encodeURIComponent(pageURL)}`;
      let fetchResponse = await fetch(fetchUrl);
      let fetchData = await fetchResponse.json();
      console.log(fetchData.lighthouseResult.categories.performance.score);

      if(fetchData.lighthouseResult.requestedUrl === page.loc && fetchData.lighthouseResult.categories.performance.score > 0.1) {
        page.performance = fetchData.lighthouseResult.categories.performance.score;
        page.accessibility = fetchData.lighthouseResult.categories.accessibility.score;
        // insert into dynamo
        page.pageURL = page.loc;
        delete page.loc;
        page.lastreviewed = new Date().getTime();
        page.sitedomain = sitedomain;
        console.log(page);

        console.log('inserting this reviewed page')
        // save the reviewed page
        let insertPage = await data.evaluations.put(page);
        console.log(insertPage);

      }
    }

  }

  let endTime = new Date().getTime();
  console.log(endTime)
  console.log(endTime - startTime);

  return {
    statusCode: 200,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: `run complete`
  }
}