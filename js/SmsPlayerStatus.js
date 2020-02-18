
let totalRewards = 0;
let totalDec = 0;
let totalLegendary,totalGold,totalOrb=0;
let leagues=[];
Date.prototype.addHours = function (h) {
	this.setHours(this.getHours() + h);
	return this;
}

async function display(player, cards) {
	return new Promise(async function (resolve, reject) {
		let details = await getPlayerDetails(player)
			let quest = await get_player_quests(player);
		let ids = await getClaimIds(player);
		let images = await getImage(ids, cards);
		let rc = await get_player_rc(player);
		let balances = await get_balances(player);
		let dec,ecr,legendary,gold,orb = 0;
		for (let i in balances) {
			if (balances[i].token === 'DEC') {
				dec = balances[i].balance;
			}
			if (balances[i].token === 'ECR') {
				ecr = balances[i].balance;
			}
			if (balances[i].token === 'LEGENDARY') {
				legendary = balances[i].balance;
			}
			if (balances[i].token === 'GOLD') {
				gold = balances[i].balance;
			}
			if (balances[i].token === 'ORB') {
				orb = balances[i].balance;
			}
			
		}
		totalRewards += details.reward;
		totalDec += dec;
		totalLegendary += legendary;
		totalGold += gold;
		totalOrb +=orb;
		let status = quest[0].claim_date == null ? 'In Progress' : 'Completed';
		let created_date = new Date(quest[0]['created_date']);
		let now = new Date()
			let reset_time = created_date.addHours(23);
		let htmlString = '';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Player</span></td>';
		htmlString += `<td>${details.name}</td>`;
		htmlString += '</tr>';
		htmlString += '<tr>';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Resource Credits</span></td>';
		htmlString += `<td>${rc}%</td>`;
		htmlString += '</tr>';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Current Rating</span></td>';
		htmlString += `<td>${details.rating}/${details.season_max_rating}</td>`;
		htmlString += '</tr>';

		htmlString += '<tr>';
		htmlString += '<td><span class="names">Current Capture Rate</span></td>';
		htmlString += `<td>${ecr / 100}%</td>`;
		htmlString += '</tr>';

		htmlString += '<tr>';
		htmlString += '<td><span class="names">DEC Balances</span></td>';
		htmlString += `<td>${dec}</td>`;
		htmlString += '</tr>';
		
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Legendary Potion</span></td>';
		htmlString += `<td>${legendary}</td>`;
		htmlString += '</tr>';
		
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Gold Potion</span></td>';
		htmlString += `<td>${gold}</td>`;
		htmlString += '</tr>';
		
		htmlString += '<tr>';
		htmlString += '<td><span class="names">ORB</span></td>';
		htmlString += `<td>${orb}</td>`;
		htmlString += '</tr>';

		htmlString += '<tr>';
		htmlString += '<td><span class="names">Daily Quest</span></td>';
		htmlString += `<td>${quest[0].name} (${quest[0].completed_items}/${quest[0].total_items})</td>`;
		htmlString += '</tr>';
		if (status === 'Completed') {
			htmlString += '<tr>';
			htmlString += '<td><span class="names">Next Quest Time</span></td>';
			htmlString += `<td>${reset_time}</td>`;
			htmlString += '</tr>';
		}

		htmlString += '<tr>';
		htmlString += '<td><span class="names">Total Wins/Battles</span></td>';
		htmlString += `<td>${details.win}/${details.battle} = ${details.win_rate}%</td>`;
		htmlString += '</tr>';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Season Total Wins/Battles</span></td>';
		htmlString += `<td>${details.season_win}/${details.season_battle} = ${details.season_win_rate}%</td>`;
		htmlString += '</tr>';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Season League</span></td>';
		htmlString += `<td>${details.league} (${details.reward} Loot Chests)</td>`;
		htmlString += '</tr>';

		htmlString += '<tr>';
		htmlString += '<td><span class="names">The Most Recent Loot Chests Claimed</span></td>';
		let imagesString = '';
		for (let i in images) {
			let image = `<div><img src="${images[i].url}" width="100px" height="150px"><ul><span>${images[i].quantity}</span></ul>`;
			imagesString += image + '</div>';
		}
		htmlString += `<td><div class="row">${imagesString}</div></td>`;
		htmlString += '</tr>';

		htmlString += '<tr>';
		htmlString += '<td></td>';
		htmlString += `<td></td>`;
		htmlString += '</tr>';

		resolve(htmlString);
	});

}

function get_player_details(player) {
	return new Promise(function (resolve, reject) {
		const url = 'https://steemmonsters.com/players/details?name=' + player;
		axios.get(url).then(function (response) {
			if (!response.data.error) {
				resolve(response.data)

			}
		}).catch(function (error) {
			reject('error');
		});
	});
}

function get_player_quests(player) {
	return new Promise(function (resolve, reject) {
		const url = 'https://steemmonsters.com/players/quests?username=' + player;
		axios.get(url).then(function (response) {
			if (!response.data.error) {
				resolve(response.data)

			}
		}).catch(function (error) {
			reject('error');
		});
	});

}

function getClaimIds(player) {
	return new Promise(function (resolve, reject) {
		const url = "https://api.steemmonsters.io/players/history?username=" + player + "&from_block=-1&limit=10&types=claim_reward";
		axios.get(url).then(function (response, error) {
			if (!error && response.status == 200) {
				let data = response.data;
				let claims = [];
				let rewards;
				for (let info of data) {
					if (!info.error) {
						let ids = JSON.parse(info.result);
						if (ids.rewards !== undefined) {
							rewards = ids.rewards;
						} else {
							rewards = ids;
						}
						for (let reward of rewards) {
							if (reward.type === 'reward_card') {
								if (reward.card !== undefined) {
									let newObj = new Object();
									newObj.type = 'reward_card';
									newObj.id = reward.card.card_detail_id;
									newObj.isGold = reward.card.gold;
									claims.push(newObj);
								} else {
									for (let card of reward.cards) {
										let newObj = new Object();
										newObj.type = 'reward_card';
										newObj.id = card.card_detail_id;
										newObj.isGold = card.gold;
										claims.push(newObj);
									}
								}
							} else if (reward.type === 'dec') {
								let newObj = new Object();
								newObj.type = 'dec';
								newObj.quantity = reward.quantity;
								claims.push(newObj);
							} else if (reward.type === 'potion') {
								let newObj = new Object();
								newObj.type = 'potion';
								newObj.potion_type = reward.potion_type;
								newObj.quantity = reward.quantity;
								claims.push(newObj);
							}else if(reward.type ==='pack'){
								let newObj = new Object();
								newObj.type = 'pack';
								newObj.quantity = reward.quantity;
								claims.push(newObj);
							}
						}
						return resolve(claims);
					}
				}
				return resolve(claims);
			}
		})
	});
}

function getImage(ids, cards) {
	return new Promise(function (resolve, reject) {
		let urls = [];
		for (let i in ids) {
			if (ids[i].type === 'reward_card') {
				for (let j in cards) {
					if (ids[i].id == cards[j].id) {
						let image = new Object();
						let url = 'https://s3.amazonaws.com/steemmonsters/cards_beta/' + cards[j].name.replace(' ', '%20');

						if (ids[i].isGold == true) {
							url += '_gold.png';
						} else {
							url += '.png';
						}
						image.url = url;
						image.quantity = 1;
						urls.push(image);
					}
				}
			} else if (ids[i].type === 'potion') {
				let image = new Object();
				if (ids[i].potion_type === 'legendary') {
					image.url = 'https://s3.amazonaws.com/steemmonsters/website/ui_elements/shop/img_potion_rarity.png';
					image.quantity = ids[i].quantity;

				} else if (ids[i].potion_type === 'gold') {
					image.url = 'https://s3.amazonaws.com/steemmonsters/website/ui_elements/shop/img_potion_gold-foil.png';
					image.quantity = ids[i].quantity;
				}
				urls.push(image);
			} else if (ids[i].type === 'dec') {
				let image = new Object();
				image.url = 'https://s3.amazonaws.com/steemmonsters/website/icons/icon_dec.svg';
				image.quantity = ids[i].quantity;
				urls.push(image)

			}else if (ids[i].type === 'pack') {
				let image = new Object();
				image.url = 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_essence-orb.png';
				image.quantity = ids[i].quantity;
				urls.push(image)

			}
		}
		resolve(urls);
	});

}

function get_details() {
	return new Promise(function (resolve, reject) {
		const url = "https://steemmonsters.com/cards/get_details";
		axios.get(url).then(function (response, error) {
			if (!error && response.status == 200) {
				let info = response.data;
				resolve(info);
			}
		})
	});
}

function get_player_rc(player) {
	return new Promise(function (resolve, reject) {
		axios.get("https://anyx.io/v1/rc_api/find_rc_accounts?accounts=" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let ac = response.data;
				if (ac == null)
					resolve('NA');
				let rcPercent = ac.rc_accounts[0].rc_manabar.current_mana / ac.rc_accounts[0].max_rc * 100;

				resolve(rcPercent.toFixed(2));
			} else {
				reject('get_player_rc error');
			}
		})
	});
}

function get_balances(player) {
	return new Promise(function (resolve, reject) {
		axios.get("https://steemmonsters.com/players/balances?username=" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let balances = response.data
					resolve(balances);
			} else {
				reject('get_balances');
			}
		})

	});
}

function hasAdded(leagues,leagueName){
	for(let league of leagues){
		if(league.name===leagueName){
			return true;
		}
		
	}
	return false;
	
	
}
function addLeague(leagues,leagueName){
	let league = new Object();
	league.name = leagueName;
	league.count =1;
	leagues.push(league);
	
}

function updateLeague(leagues,leagueName){
	for(let league of leagues){
		if(league.name===leagueName){
			league.count++;
			return;
		}
		
	}
	return;
	
}

function getPlayerDetails(player) {
	return new Promise(async function (resolve, reject) {
		let playerDetails = new Object();
		let detail = await get_player_details(player);
		if (detail != 'error' && detail.season_details.battles != null) {
			playerDetails.name = detail.name;
			playerDetails.rating = detail.rating;
			playerDetails.battle = detail.battles;
			playerDetails.win = detail.wins;
			playerDetails.win_rate = (detail.wins / detail.battles * 100).toFixed(2);
			playerDetails.capture_rate = detail.capture_rate;
			playerDetails.season_battle = detail.season_details.battles;
			playerDetails.season_win = detail.season_details.wins;
			playerDetails.season_max_rating = detail.season_details.max_rating;
			playerDetails.season_win_rate = (playerDetails.season_win / playerDetails.season_battle * 100).toFixed(2)
			let seasonRating = detail.season_details.max_rating;
			if (seasonRating >= 0 && seasonRating <= 99) {
				playerDetails.league = 'Novice';
				playerDetails.reward = 0;
			} else if (seasonRating >= 100 && seasonRating <= 399) {
				playerDetails.league = 'Bronze 3'
					playerDetails.reward = 5;

			} else if (seasonRating >= 400 && seasonRating <= 699) {
				playerDetails.league = 'Bronze 2'
					playerDetails.reward = 7;
			} else if (seasonRating >= 700 && seasonRating <= 999) {
				playerDetails.league = 'Bronze 1'
					playerDetails.reward = 9;
			} else if (seasonRating >= 1000 && seasonRating <= 1299) {
				playerDetails.league = 'Silver 3'
					playerDetails.reward = 12;
			} else if (seasonRating >= 1300 && seasonRating <= 1599) {
				playerDetails.league = 'Silver 2'
					playerDetails.reward = 15;
			} else if (seasonRating >= 1600 && seasonRating <= 1899) {
				playerDetails.league = 'Silver 1'
					playerDetails.reward = 18;
			} else if (seasonRating >= 1900 && seasonRating <= 2199) {
				playerDetails.league = 'Gold 3'
					playerDetails.reward = 22;
			} else if (seasonRating >= 2200 && seasonRating <= 2499) {
				playerDetails.league = 'Gold 2'
					playerDetails.reward = 26;
			} else if (seasonRating >= 2500 && seasonRating <= 2799) {
				playerDetails.league = 'Gold 1'
					playerDetails.reward = 30;
			} else if (seasonRating >= 2800 && seasonRating <= 3099) {
				playerDetails.league = 'Diamon 3'
					playerDetails.reward = 40;
			} else if (seasonRating >= 3100 && seasonRating <= 3399) {
				playerDetails.league = 'Diamon 2'
					playerDetails.reward = 50;
			} else if (seasonRating >= 3400 && seasonRating <= 3699) {
				playerDetails.league = 'Diamon 1'
					playerDetails.reward = 60;
			} else if (seasonRating >= 3700 && seasonRating <= 4199) {
				playerDetails.league = 'Champion 3'
					playerDetails.reward = 80;
			} else if (seasonRating >= 4200 && seasonRating <= 4699) {
				playerDetails.league = 'Champion 2'
					playerDetails.reward = 120;
			} else if (seasonRating >= 4700) {
				playerDetails.league = 'Champion 1'
					playerDetails.reward = 150;
			}
			if(hasAdded(leagues,playerDetails.league)){
					updateLeague(leagues,playerDetails.league);
					
				}else{
					addLeague(leagues,playerDetails.league);
				}
			resolve(playerDetails);
		}
	});
}

$(document).ready(async function () {

	$('#view').submit(async function (e) {
		e.preventDefault();
		$('#log').val('');
		const input = $('#username').val();
		let usernames = input.split(',');
		let htmlString = '<table id="dvlist" class="display" style="width:100%">';
		let cards = await get_details();
		totalRewards = 0;
		totalDec = 0;
		totalLegendary=0
		totalGold=0;
		totalOrb=0;
		leagues=[];
		for (let i in usernames) {
			let username = usernames[i];
			let string = await display(username, cards);
			htmlString += string;
		}
		htmlString += `</table>`;
		let summary = `<B>Total Season Loot Chests:</B>${totalRewards}<br/><B>Total DEC:</B>${totalDec.toFixed(3)}<br/><B>Total Legendary Potion:</B>${totalLegendary}<br/><B>Total Gold Potion:</B>${totalGold}<br/><B>Total Orb:</B>${totalOrb}`;
		for(let league of leagues){
			summary +=`<br/><B>League:</B>${league.name} <B>Count:</B>${league.count}`;
		}
		$('div#summary').html(summary);
		$('div#display').html(htmlString);

	});
});
