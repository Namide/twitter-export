
(() => {
  'use strict'

  let scrollNextTimeout
  let endTimeout
  let count
  let pauseVideo = 0
  const tweets = []

  const start = () => {
    addTweetsLoadListener()
    window.scroll(0, window.innerHeight)
    setTimeout(scrollNext, 2000)
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
            pauseVideo++
            videoButton.click()
            let loadTimeout

            const load = () => {
              const video = el.querySelector('video')
              if (video) {
                const videoHref = video.src
                if (videoHref.indexOf('http') === 0) {
                  inputs = [videoHref]
                }
                addTweet({ text, date, inputs, link })
                clearTimeout(lastTimeout)
                pauseVideo--
              } else {
                loadTimeout = setTimeout(load, 125)
              }
            }

            // If load error
            const lastTimeout = setTimeout(() => {
              clearTimeout(loadTimeout)
              pauseVideo--
            }, 5000)
            
            load()
          } else {
            addTweet({ text, date, inputs, link })
          }
        }
      })

    if (count !== tweets.length) {
      count = tweets.length
      console.log('loaded:', tweets.length)
    }
  }

  const isEnd = () => {
    const current = window.scrollY + window.innerHeight
    const max = Math.max( document.body.scrollHeight, document.body.offsetHeight)

    if (current >= max) {
      return new Promise(resolve => {
        setTimeout(() => {
          const current = window.scrollY + window.innerHeight
          const max = Math.max( document.body.scrollHeight, document.body.offsetHeight)
          resolve(current >= max)
        }, 10000)
      })
    } else {
      return Promise.resolve(false)
    }
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

  const scrollNext = () => {
    getTweets()

    isEnd()
      .then(isEnd => {
        if (!isEnd) {
          if (pauseVideo === 0) {
            const next = window.scrollY + 20
            window.scroll(0, next)
          }
          clearTimeout(scrollNextTimeout)
          scrollNextTimeout = setTimeout(scrollNext, 10)
        } else {
          clearTimeout(scrollNextTimeout)
          clearTimeout(endTimeout)
          onEnd()
        }
      })
  }

  const onEnd = () => {
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
