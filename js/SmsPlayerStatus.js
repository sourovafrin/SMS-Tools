

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}


async function display(player,cards) {
    return new Promise(async function (resolve, reject) {
        let details = await getPlayerDetails(player)
        let quest = await get_player_quests(player);
        let ids = await getClaimIds(player);
        let images = await getImage(ids,cards);
        let rc = await get_player_rc(player);
        let balances = await get_balances(player);
        let dec=0;
        let ecr=0;
        for(let i in balances){
            if(balances[i].token==='DEC'){
                dec = balances[i].balance;
            }
            if(balances[i].token==='ECR'){
                ecr=balances[i].balance;
            }
        }
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
        htmlString += `<td>${ecr/100}%</td>`;
        htmlString += '</tr>';

        htmlString += '<tr>';
        htmlString += '<td><span class="names">DEC Balances</span></td>';
        htmlString += `<td>${dec}</td>`;
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
        htmlString += `<td>${details.league} (${details.reward} Reward Cards)</td>`;
        htmlString += '</tr>';

        htmlString += '<tr>';
        htmlString += '<td><span class="names">The Most Recent Rewards Claimed</span></td>';
        let imagesString = '';
        for (let i in images) {
            let image = `<img src="${images[i]}" width="100px" height="150px">`;
            imagesString += image;
        }
        htmlString += `<td>${imagesString}</td>`;
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
        const url = "https://api.steemmonsters.io/players/history?username=" + player + "&from_block=-1&limit=1&types=sm_claim_reward";
        axios.get(url).then(function (response, error) {
            if (!error && response.status == 200) {
                let info = response.data;
                let claims = [];
                let ids = JSON.parse(info[0].result);
                for (let i in ids) {
                    let newObj = new Object();
                    newObj.id=ids[i].card_detail_id;
                    newObj.isGold=ids[i].gold;
                    claims.push(newObj);
                }
                resolve(claims);
            }
        })
    });
}

function getImage(ids,cards) {
    return new Promise(function (resolve, reject) {
            let urls = [];
                for (let i in ids) {
                    for (let j in cards) {
                        if (ids[i].id == cards[j].id) {
                            let url = 'https://s3.amazonaws.com/steemmonsters/cards_beta/' + cards[j].name.replace(' ', '%20');
                            if (ids[i].isGold == true) {
                                url += '_gold.png';
                            } else {
                                url += '.png';
                            }
                            urls.push(url);
                        }
                    }
                }
                resolve(urls);
        });

}

function get_details(){
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

function get_player_rc(player){
    return new Promise(function (resolve, reject) {
        axios.get("https://anyx.io/v1/rc_api/find_rc_accounts?accounts="+player).then(function (response,error) {
            if (!error && response.status == 200) {
                let ac = response.data
                let rcPercent = ac.rc_accounts[0].rc_manabar.current_mana / ac.rc_accounts[0].max_rc*100;
                
                resolve(rcPercent.toFixed(2));
            }else{
                reject('get_player_rc error');
            }
        })
    });
}

function get_balances(player){
    return new Promise(function (resolve, reject) {
        axios.get("https://steemmonsters.com/players/balances?username="+player).then(function(response,error){
            if (!error && response.status == 200) {
                let balances = response.data
                resolve(balances);                
            }else{
                reject('get_balances');
            }
        })

    });
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
            }
            else if (seasonRating >= 1600 && seasonRating <= 1899) {
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
        for (let i in usernames) {
            let username = usernames[i];
            let string = await display(username,cards);
            htmlString += string;
        }
        htmlString += '</tbody></table>';
        $('div#display').html(htmlString);

    });
});