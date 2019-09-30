console.log('hello  饥人谷sss')
import './icons.js'
import Swiper from './swiper.js'




class Player {
    constructor(node) {
        this.$ = selector => this.root.querySelector(selector)
        this.$$ = selector => this.root.querySelectorAll(selector)

        this.root = typeof node === 'string' ? document.querySelector(node) : node //判断node如果是字符串则获取dom元素,如果是对象则直接当作node
        this.songList = [] //音乐列表
        this.currentIndex = 0 //列表下标,用来定位播放列表
        this.audio = new Audio()
        this.lyricsArr = []
        this.lyricIndex = -1
        this.start()
        this.bind()
    }

    start() {
        fetch('https://jirengu.github.io/data-mock/huawei-music/music-list.json')
            .then(res => res.json())
            .then(data => {
                console.log(data);
                this.songList = data //获取数据并赋值给songList
                    // this.audio.src = this.songList[this.currentIndex].url //通过下标从当前的列表中获取音乐对象url并赋值
                this.loadSong()
            })
    }

    bind() {
        let self = this
        this.$('.btn-play-pause').onclick = function() {
            if (this.classList.contains('playing')) { //判断是否有某一个class
                self.audio.pause()
                this.classList.remove('playing')
                this.classList.add('pause')
                this.querySelector('use').setAttribute('xlink:href', '#icon-play') //修改属性
            } else if (this.classList.contains('pause')) {
                self.audio.play()
                this.classList.remove('pause')
                this.classList.add('playing')
                this.querySelector('use').setAttribute('xlink:href', '#icon-pause')
            }
        }

        this.$('.btn-pre').onclick = function() {
            self.loadSong()
            console.log('left');
            self.playPreSong()
        }

        this.$('.btn-next').onclick = function() {
            self.loadSong()
            self.playNextSong()
            console.log('right');
        }

        this.audio.ontimeupdate = function() {
            console.log(parseInt(self.audio.currentTime * 1000)) //定位时间
            self.locateLyric()
            self.setProgerssBar()
        }

        let swiper = new Swiper(this.$('.panels'))
        swiper.on('swipLeft', function() {
            this.classList.remove('panel1')
            this.classList.add('panel2')
        })

        swiper.on('swipRight', function() {
            this.classList.remove('panel2')
            this.classList.add('panel1')
        })
    }
    playPreSong() {
        this.currentIndex = (this.songList.length + this.currentIndex - 1) % this.songList.length
        this.audio.src = this.songList[this.currentIndex].url
        this.audio.oncanplaythrough = () => this.audio.play() //当音乐就绪后再调用播放
    }
    playNextSong() {
        this.currentIndex = (this.currentIndex + 1) % this.songList.length
        this.audio.src = this.songList[this.currentIndex].url
        this.audio.oncanplaythrough = () => this.audio.play()
    }

    loadSong() {
        let songObj = this.songList[this.currentIndex]
        this.$('.header h1').innerText = songObj.title
        this.$('.header p').innerText = songObj.author + '-' + songObj.albumn
        this.audio.src = songObj.url
        this.audio.onloadedmetadata = () => this.$('.time-end').innerText = this.formateTime(this.audio.duration) //获取歌曲总时长
        this.loadLyric()
    }


    loadLyric() {
        fetch(this.songList[this.currentIndex].lyric)
            .then(res => res.json())
            .then(data => {
                console.log(data.lrc.lyric)
                this.setLyrics(data.lrc.lyric)
                window.lyrics = data.lrc.lyric
            })
    }



    //比较播放时间和歌词时间
    locateLyric() {
        let currentTime = this.audio.currentTime * 1000
        let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0]
        if (currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
            this.lyricIndex++
                let node = this.$('[data-time="' + this.lyricsArr[this.lyricIndex][0] + '"]')
            if (node) this.setLyricToCenter(node)
            this.$$('.panel-effect .lyric p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
            this.$$('.panel-effect .lyric p')[1].innerText = this.lyricsArr[this.lyricIndex + 1] ? this.lyricsArr[this.lyricIndex + 1][1] : ''

        }
    }

    setLyrics(lyrics) {
        this.lyricIndex = 0
        let fragment = document.createDocumentFragment()
        let lyricsArr = []
        this.lyricsArr = lyricsArr
        lyrics.split(/\n/)
            .filter(str => str.match(/\[.+?\]/))
            .forEach(line => {
                let str = line.replace(/\[.+?\]/g, '')
                line.match(/\[.+?\]/g).forEach(t => {
                    t = t.replace(/[\[\]]/g, '') //去除括号,得到时间
                    let milliseconds = parseInt(t.slice(0, 2)) * 60 * 1000 + parseInt(t.slice(3, 5)) * 1000 + parseInt(t.slice(6)) //统一时间,用毫秒数
                    lyricsArr.push([milliseconds, str])
                })
            })

        lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => { //根据时间对歌词排序
            if (v1[0] > v2[0]) {
                return 1
            } else {
                return -1
            }
        }).forEach(line => {
            let node = document.createElement('p')
            node.setAttribute('data-time', line[0])
            node.innerText = line[1]
            fragment.appendChild(node)
        })
        this.$('.panel-lyrics .container').innerHTML = ''
        this.$('.panel-lyrics .container').appendChild(fragment)
    }

    setLyricToCenter(node) {
        console.log(node)
        let translateY = node.offsetTop - this.$('.panel-lyrics').offsetHeight / 2
        translateY = translateY > 0 ? translateY : 0
        this.$('.panel-lyrics .container').style.transform = `translateY(-${translateY}px)`
        this.$$('.panel-lyrics p').forEach(node => node.classList.remove('current'))
        node.classList.add('current')
    }


    //进度条
    setProgerssBar() {
        console.log('set setProgerssBar')
        let percent = (this.audio.currentTime * 100 / this.audio.duration) + '%'
        console.log(percent)
        this.$('.bar .progress').style.width = percent
        this.$('.time-start').innerText = this.formateTime(this.audio.currentTime)
        console.log(this.$('.bar .progress').style.width)
    }

    formateTime(secondsTotal) {
        let minutes = parseInt(secondsTotal / 60)
        minutes = minutes >= 10 ? '' + minutes : '0' + minutes
        let seconds = parseInt(secondsTotal % 60)
        seconds = seconds >= 10 ? '' + seconds : '0' + seconds
        return minutes + ':' + seconds
    }

}


window.p = new Player('#player')