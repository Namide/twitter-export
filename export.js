
(() => {
  'use strict'

  let scrollNextTimeout
  const tweets = []

  const start = () => {
    addTweetsLoadListener()
    scrollNext()
  }

  const getTweets = () => {
    [...document.querySelectorAll('*[data-testid="tweet"]')]
      .map(el => {
        if (el.querySelector('*[lang]'))
        {
          const text = el.querySelector('*[lang]').textContent
          let inputs = [...el.querySelectorAll('img[alt="Image"]')]
            .map(img => img.src.replace('&name=small', ''))
          const date = el.querySelector('time').getAttribute('datetime')
          const link = el.querySelector('a[role=link][title]').href
          const videoButton = el.querySelector('*[data-testid="previewInterstitial"]')

          if (!videoButton && inputs.length < 1) {
            const externalLink = el.querySelector('a[role=link][target=_blank]')
            if (externalLink) {
              inputs = [externalLink.href]
            }
          }
          
          if (videoButton) {
            clearTimeout(scrollNextTimeout)
            videoButton.click()

            const load = () => {
              const video = el.querySelector('video')
              if (video) {
                const videoHref = video.src
                if (videoHref.indexOf('http') === 0) {
                  inputs = [videoHref]
                }
                addTweet({ text, date, inputs, link })
                scrollNext()
              } else {
                setTimeout(load, 125)
              }
            }
            load()
          } else {
            addTweet({ text, date, inputs, link })
          }
        }
      })

    console.log('loaded:', tweets.length)
  }

  const addTweet = ({ text, date, link, inputs = [] }) => {
    const hash = text + ',' + date + ',' + link
    if (!tweets.find(tweet => tweet.hash === hash)) {
      if (inputs.length > 0) {
        tweets.push(...inputs.map(input => ({ hash, text, date, input, link })))
      } else {
        tweets.push({ hash, text, date, input: '', link })
      }
    }
  }

  const scrollNext = (force = false) => {
    const next = window.scrollY + 20
    const current = window.scrollY + window.innerHeight
    const limit = Math.max( document.body.scrollHeight, document.body.offsetHeight)

    getTweets()

    if (current < limit) {
      window.scroll(0, next)
      clearTimeout(scrollNextTimeout)
      scrollNextTimeout = setTimeout(scrollNext, 10)
    } else if (force) {
      onEnd()
    } else {
      window.scroll(0, next)
      clearTimeout(scrollNextTimeout)
      scrollNextTimeout = setTimeout(scrollNext, 10000, true)
    }
  }

  const onEnd = () => {
    console.log('ended')
    const csv = createCsv(tweets)
    downloadCsv(csv)
  }

  const addTweetsLoadListener = () => {      
    const resizeObserver = new ResizeObserver(getTweets)
    const container = document.body.querySelector('main>div>div')
    resizeObserver.observe(container)
  }

  const sanitizeStr = (str = '') => {
    str = str.replace(/"/g, '""')
    str = str.replace(/,/g, '\,')
    str = str.replace(/'/g, '\'')

    return `"${ str }"` 
  }

  const createCsv = tweets => {
    let csv = 'date,from,input,description\n'

    tweets.forEach(tweet => {
      csv += sanitizeStr(tweet.date)
        + ',' + sanitizeStr(tweet.link)
        + ',' + sanitizeStr(tweet.input)
        + ',' + sanitizeStr(tweet.text)
        + '\n'
    })

    return csv
  }

  const downloadCsv = (str) => {
    const blob = new Blob([str], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, "likes.csv");
    } else {
      const link = document.createElement("a");
      if (link.download !== undefined) {
        let url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "likes.csv")
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }
  
  start()
})()
