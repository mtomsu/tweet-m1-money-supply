const main = async options => {
  // Validate payload.
  if (!options) throw `Missing required argument (options)`
  if (!options.deps) throw `Invalid payload; missing required property (deps)`
  if (!options.env) throw `Invalid payload; missing required property (env)`
  const { deps, env } = options

  // Validate deps.
  if (!deps.axios) throw `Missing required dependecy (axios)`
  if (!deps.DateTime) throw `Missing required dependecy (DateTime)`
  if (!deps.logger) throw `Missing required dependecy (logger)`
  if (!deps.querystring) throw `Missing required dependecy (querystring)`
  if (!deps.secretsmanager) throw `Missing required dependecy (secretsmanager)`
  if (!deps.Twitter) throw `Missing required dependecy (Twitter)`
  if (!deps.urljoin) throw `Missing required dependecy (urljoin)`

  // Validate env.
  if (!env.SECRET_ID_TWITTER_CREDENTIALS)
    throw `Missing required env var (SECRET_ID_TWITTER_CREDENTIALS)`

  // Get deps.
  const {
    axios,
    DateTime,
    logger,
    querystring,
    secretsmanager,
    Twitter,
    urljoin
  } = options.deps

  // Retrieve secrets.
  const twitterCredentials = await retrieveSecret(
    secretsmanager,
    env.SECRET_ID_TWITTER_CREDENTIALS
  )
  logger.info(
    `Successfully retrieved secret (${env.SECRET_ID_TWITTER_CREDENTIALS})`
  )

  // Intantiate Twitter client.
  const twitterClient = new Twitter({
    consumer_key: twitterCredentials.apiKey,
    consumer_secret: twitterCredentials.apiKeySecret,
    access_token_key: twitterCredentials.accessToken,
    access_token_secret: twitterCredentials.accessTokenSecret
  })
  logger.info(`Successfully instantiated Twitter client`)

  // Determine dates for FRED image URL.
  const {
    startAtFormatted,
    todayFormatted,
    firstOfYearFormatted,
    firstOfPreviousMonthFormatted
  } = determineFREDDates(DateTime)
  logger.info(
    `Retrieving M1 money supply image with dates: today (${todayFormatted}), start (${startAtFormatted}), first of year (${firstOfYearFormatted}), first of previous month (${firstOfPreviousMonthFormatted})`
  )

  // Retrieve image.
  const imageURLParams = {
    dwnld: 1,
    hires: 1,
    drp: 0,
    chart_type: 'line',
    type: 'image/png',
    height: 450,
    width: 1168,
    bgcolor: '#e1e9f0',
    graph_bgcolor: '#ffffff',
    txtcolor: '#444444',
    line_color: '#4572a7',
    mode: 'fred',
    recession_bars: 'on',
    fo: 'open sans',
    ts: 12,
    tts: 12,
    nt: 0,
    thu: 0,
    trc: 0,
    show_legend: 'yes',
    show_axis_titles: 'yes',
    show_tooltip: 'yes',
    id: 'M1SL',
    scale: 'left',
    link_values: 'false',
    line_style: 'solid',
    mark_type: 'none',
    mw: 3,
    lw: 2,
    ost: -99999,
    oet: 99999,
    mma: 0,
    fml: 'a',
    fq: 'Monthly',
    fam: 'avg',
    fgst: 'lin',
    line_index: 1,
    transformation: 'lin',
    cosd: startAtFormatted,
    coed: firstOfYearFormatted,
    fgsnd: firstOfPreviousMonthFormatted,
    vintage_date: todayFormatted,
    revision_date: todayFormatted,
    nd: startAtFormatted
  }
  const imageBaseURL = `https://fred.stlouisfed.org/graph/fredgraph.png`
  const imageURL = urljoin(
    imageBaseURL,
    `?${querystring.stringify(imageURLParams)}`
  )
  const imageBuffer = await retrieveImageBufferFromURL(axios, imageURL)
  logger.info(`Successfully retrieved M1 money supply image (${imageURL})`)

  // Upload the image for the Tweet.
  const mediaResponse = await twitterClient.post('media/upload', {
    media: imageBuffer
  })
  logger.info(`Successfully uploaded image to Twitter:`, mediaResponse)

  // Validate response.
  if (!mediaResponse || !mediaResponse.media_id_string)
    throw `Unexpected response; missing expected property (media.media_id_string)`

  // Post tweet.
  const tweet = {
    //status: '',
    media_ids: mediaResponse.media_id_string
  }
  const tweetResponse = await twitterClient.post('statuses/update', tweet)
  logger.info(`Successfully tweeted:`, tweetResponse)

  return `Finished processing`
}

const retrieveSecret = async (secretsmanager, secretID) => {
  const secret = await secretsmanager
    .getSecretValue({ SecretId: secretID })
    .promise()

  return JSON.parse(secret.SecretString)
}

const determineFREDDates = (DateTime, startAtFormatted = '1959-01-01') => {
  const today = DateTime.utc()
  const todayFormatted = today.toISODate()
  const firstOfYearFormatted = today.startOf('year').toISODate()
  const firstOfPreviousMonthFormatted = today
    .minus({ months: 1 })
    .startOf('month')
    .toISODate()
  return {
    startAtFormatted,
    todayFormatted,
    firstOfYearFormatted,
    firstOfPreviousMonthFormatted
  }
}

const retrieveImageBufferFromURL = (axios, imageURL) => {
  return axios
    .get(imageURL, { responseType: 'arraybuffer' })
    .then(r => Buffer.from(r.data), 'binary')
}

module.exports = {
  determineFREDDates,
  main,
  retrieveImageBufferFromURL,
  retrieveSecret
}
