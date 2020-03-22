
(() => {
  'use strict'

  let endTimeout
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
          const imgs = [...el.querySelectorAll('img[alt="Image"]')]
            .map(img => img.src.replace('&name=small', ''))
          const date = el.querySelector('time').getAttribute('datetime')
          const link = el.querySelector('a[role=link][title]').href
          // const video = el.querySelector('*[data-testid="playButton"]').href
          // if (video) { }

          const hash = text + ',' + date + ',' + link + ',' + imgs.join(',')
          
          if (!tweets.find(tweet => tweet.hash === hash)) {
            if (imgs.length > 0) {
              tweets.push(...imgs.map(img => ({ hash, text, date, img, link })))
            } else {
              tweets.push({ hash, text, date, img: '', link })
            }
          }
        }
      })

    console.log('loaded:', tweets.length)
  }

  const scrollNext = () => {
    const next = window.scrollY + 20
    const nextLimit = window.scrollY + window.innerHeight
    const limit = Math.max( document.body.scrollHeight, document.body.offsetHeight)

    getTweets()

    if (nextLimit < limit) {
      window.scroll(0, next)
      setTimeout(scrollNext, 10)
    } else {
      clearTimeout(endTimeout)
      endTimeout = setTimeout(onEnd, 5000)
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
        + ',' + sanitizeStr(tweet.img)
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
