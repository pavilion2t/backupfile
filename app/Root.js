import React, { Component } from 'react';
import { Router, IndexRoute, Link, Route, browserHistory, hashHistory} from 'react-router';
import { MUSIC_LIST } from './config/config';
import { randomRange } from './utils/util';
let PubSub = require('pubsub-js');

import PlayerPage from './page/player';
import listPage from './page/list';
import Logo from './components/logo'

class App extends Component{
	constructor(props){
		super(props);
		this.state = {
			musicList: MUSIC_LIST,
			currentMusitItem: {},
			repeatType: 'cycle'
		}

	}

	componentDidMount() {
		$("#player").jPlayer({
			supplied: "mp3",
			wmode: "window",
			useStateClassSkin: true
		});

		this.playMusic(this.state.musicList[0]);

		$("#player").bind($.jPlayer.event.ended, (e) => {
			this.playWhenEnd();
		});
		//事件绑定，102行播放函数
		PubSub.subscribe('PLAY_MUSIC', (msg, item) => {
			this.playMusic(item);
		});

		//删除采用过滤操作
		PubSub.subscribe('DEL_MUSIC', (msg, item) => {
			this.setState({
				musicList: this.state.musicList.filter((music) => {
					return music !== item;
				})
			});
		});
		PubSub.subscribe('PLAY_NEXT', () => {
			this.playNext();
		});
		PubSub.subscribe('PLAY_PREV', () => {
			this.playNext('prev');
		});
		let repeatList = [
			'cycle',
			'once',
			'random'
		];
		PubSub.subscribe('CHANAGE_REPEAT', () => {
			let index = repeatList.indexOf(this.state.repeatType);
			index = (index + 1) % repeatList.length;
			this.setState({
				repeatType: repeatList[index]
			});
		});
	}

	componentWillUnmount() {
		PubSub.unsubscribe('PLAY_MUSIC');
		PubSub.unsubscribe('DEL_MUSIC');
		PubSub.unsubscribe('CHANAGE_REPEAT');
		PubSub.unsubscribe('PLAY_NEXT');
		PubSub.unsubscribe('PLAY_PREV');
	}

	playWhenEnd() {
		if (this.state.repeatType === 'random') {
			let index = this.findMusicIndex(this.state.currentMusitItem);
			let randomIndex = randomRange(0, this.state.musicList.length - 1);
			while(randomIndex === index) {
				randomIndex = randomRange(0, this.state.musicList.length - 1);
			}
			this.playMusic(this.state.musicList[randomIndex]);
		} else if (this.state.repeatType === 'once') {
			this.playMusic(this.state.currentMusitItem);
		} else {
			this.playNext();
		}
	}

	playNext(type = 'next') {
		//最后一首+1会造成数组溢出问题，0-1会出现负数
		let index = this.findMusicIndex(this.state.currentMusitItem);
		if (type === 'next') {
			index = (index + 1) % this.state.musicList.length;
		} else {
			index = (index + this.state.musicList.length - 1) % this.state.musicList.length;
		}
		let musicItem = this.state.musicList[index];
		this.setState({
			currentMusitItem: musicItem
		});
		this.playMusic(musicItem);
	}

	findMusicIndex(music) {
		let index = this.state.musicList.indexOf(music);
		return Math.max(0, index);
	}


	  //设置播放的文件，同时更新组件的事件状态
	playMusic(item) {
		$("#player").jPlayer("setMedia", {
			mp3: item.file
		}).jPlayer('play');
		this.setState({
			currentMusitItem: item
		});
	}

	//cloneElement方法对组件进行克隆，并且传值
  render() {
        return (
            <div className="container">
            	<Logo></Logo>
            	{React.cloneElement(this.props.children, this.state)}
            </div>
        );
    }
}

// Route可以嵌套
export class Root extends Component{
	constructor(props){
		super(props);
	}

	render() {
			return (
				<Router history={hashHistory}>
						<Route path="/" component={App}>
								<IndexRoute component={PlayerPage}/>
								<Route path="/list" component={listPage} />
						</Route>
				</Router>
		);
	}

}

export default Root;
