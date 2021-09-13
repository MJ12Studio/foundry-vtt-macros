/*
    * Requires Loot sheet 5e
    
    Online Update!

    ============================================================

    * Buttons to add:
        * Distribute coins evenly
            * Chat message for what each token gets
        * Sell selected items
            * Merchants never give full price
            * Re-Roll button

    ======================= Questions =======================
    ? Can we drag/drop items to/from merchant and have gp updated in source/destination token?

    ======================= V2.0 =======================
    * Set flag so it can't be looted more than once
    * Sell partials
       * Choose items to sell (checklist)

*/
console.clear();
main();
   
async function chest_clear(){
    let chest = token("Group Treasure Chest");
    await chest.deleteAllItems();
}
async function inventory_stack(){
    info("Stacking inventory...");
    let items = [];
    let items_qty = [];
    let items_updates = [];
    let items_to_add_raw = [];
    let items_to_delete = [];
    let loot_value = 0;
    let chest = token("Group Treasure Chest");
    for (let item of chest.getItems()){

        if (item.type === "loot"){
            //console.log("Loot!", item)
            loot_value += item.total_value;
            items_to_delete.push(item._id);
        } else {
            //console.log("item", item);
            let item_name = item.name;
            if (items_qty[item_name]){
                //console.log("item_name: " + item_name + " exists. Deleting one.");
                //console.log("qty to add: ", item.quantity);
                items_qty[item_name] += item.quantity;

                //Adjust qty of 1st item
                //console.log("adjusting item: ", items[item_name]);
                items_updates.push({
                    _id:items[item_name], 
                    data:{
                        quantity: items_qty[item_name]
                    }
                });
                //Delete this item
                items_to_delete.push(item._id);
            } else {
                //console.log("Adding item: " + item_name);
                items_qty[item_name] = item.quantity;
                items[item_name] = item._id;
            }
        }
    }
    //console.log(items_qty);
    //console.log("items_updates: ", items_updates);
    await chest.updateItems(items_updates);
    await chest.deleteItems(items_to_delete);

    //Misc Loot
    items_to_add_raw.push({
        name: "Coins/Gems",
        type: "loot",
        data: {
            quantity: 1,
            price: loot_value,
        },
        total_value: loot_value
    });
    console.log(items_to_add_raw);
    await chest.actor.createEmbeddedDocuments("Item", items_to_add_raw);

    //End
    info("Finished looting!");
    let t = setTimeout(function(){ info("....") }, 3000);
    return 0;
}

async function npc_loot(opt){
    console.log("opt: ", opt);
    if (selected().length > 0){
        //console.log("#NPCs:",selected().length);
    } else {
        warn("No NPCs selected to loot!");
        return 0;
    }
    //Find Master Chest
    //console.log(canvas.tokens.children);
    //let chest = game.actors.getName("Master Treasure Chest");     //Works, but points to actor
    //let chest = canvas.tokens.children.find( token => token.name === "Master Treasure Chest");
    let chest = token("Group Treasure Chest");
    if (!chest){
        //console.log("Creating Group Treasure Chest token");
    
        //Figure out where to place a chest. Grid placement is based on 50X50 spacing
        let maxX = 0;
        let maxY = 0;
        let sceneID = "";
        for (let t of selected()){
            if (t.x > maxX){ maxX = t.x; }
            if (t.y > maxY){ maxY = t.y; }
            sceneID = t.scene._id;
        }
        //Create actor (if necessary);
        let actor = game.actors.getName("Group Treasure Chest");
        if (!actor){
            //console.log("Creating Group Treasure Chest actor");
            actor = await Actor.create({
                name: "Group Treasure Chest",
                type: "npc",
                img: "icons/containers/chest/chest-reinforced-steel-walnut-brown.webp",
                "flags.core.sheetClass" : `dnd5e.LootSheet5eNPC`,
                "flags.lootsheetnpc5e.lootsheettype" : "Loot",
            });
            l("Actor created:", actor);
        } else {
            //console.log("Group Treasure Chest actor exists!");
        }

        console.log("actor._id before token:", actor._id);

        let doc = {
            img: "icons/containers/chest/chest-reinforced-steel-walnut-brown.webp",
            name: "Group Treasure Chest",
            x: maxX,
            y: maxY + 50,
            width: 1,
            height: 1,
            vision: false,
            hidden: false,
            actorId: actor._id,
            actorLink: true,
            actorData: actor.data
        };
        await Token.create(doc);

        l("Chest was created!: ", chest);

        //let scene = game.scenes.contents.find(sc => sc.id == sceneID);
        //await scene.createEmbeddedDocuments("Token", [doc]);
    } else {
        //console.log("Group Treasure Chest Token exists!!!");
    }


    l("Chest before:", chest);
    chest = token("Group Treasure Chest");
    l("Chest.actor before:", chest.actor);

    let items_to_add = [];
    for (let npc of selected()){    //Loop through all selected tokens
        npc = token(npc.id);
        
        for (let item of npc.getItems()){
            if (item.type === "weapon" || item.type === "equipment"){
                if (!opt.cutoff_100gp || (opt.cutoff_100gp && item.total_value >= 100)){
                    items_to_add.push(item.toObject());
                }
            } else if (item.type === "loot"){
                items_to_add.push(item.toObject());
            }
        }
        
    }
    await chest.actor.createEmbeddedDocuments("Item", items_to_add);

    //Combine inventory items if possible
    inventory_stack();
}

function roll_lo_hi(lo, hi){
    return roll_simple(hi - lo + 1) + lo - 1;
}
function roll_simple(d){
    return Math.floor(Math.random() * d) + 1
}

async function main(){
    //Find out if settings for looter are registered
    let settings = await game.settings.get("MJMacros", "looter_settings");
    if (!settings){
        await game.settings.register("MJMacros", "looter_settings", {
            scope: "world",
            config: false,
            default: {sell_percent:100, buy_percent:100},
            type: Object
        });
        settings = await game.settings.get("MJMacros", "looter_settings");
    }

    let opt = [];
    let d = new Dialog({
        title: "Looter",
        content: `
            <p>&nbsp;</p>
            <div><label>Cutoff 100gp:</label>     <input id='cutoff_100gp' type='checkbox' checked /></div>
            <br>
            <p><hr></p>
            <center><div id='div_statusbar'>....</div></center><hr>
            <hr>
            <div>
                <table border=0 cellpadding=0 cellspacing=0>
                    <tr>
                        <td width='50px'>Sell%</td>
                        <td width='250px'>
                            <input type="range" id="sell_percent" name="sell_percent"
                                min="10" max="200" step="10" value="100" onchange="
                                    let elem = document.getElementById('sell_percent_value');
                                    elem.innerHTML = '&nbsp;&nbsp;' + this.value + '%';
                            ">
                        </td>
                        <td><div id='sell_percent_value'>&nbsp;&nbsp;100%</div></td>
                    </tr>
                </table>
                
            </div>
        `,
        buttons: {
            one: {
                label: "Loot Selected NPCs",
                callback: () => {
                    //opt.cutoff_100gp = document.getElementById("cutoff_100gp").checked;
                    opt.cutoff_100gp = $("#cutoff_100gp").prop('checked');
                    let t = setTimeout(async function(){
                        if (!opt.cutoff_100gp){ $("#cutoff_100gp").prop('checked', false);}
                        info("The looting has begun...");
                        await npc_loot(opt);
                    }, 100);
                    d.render(true);
                },
                width: 50
            },
            two: {
                label: "Sell",
                callback: () => {
                    d.render(true);
                    //if (window.confirm("Do you really want to clear out chest?")) {
                        let value = document.getElementById('sell_percent').value;
                        console.log("Sell Percent: " + value);
                    //}
                }
            },
            three: {
                label: "Roll %",
                callback: () => {
                    d.render(true);
                    settings.buy_percent = roll_lo_hi(90,150);
                    settings.sell_percent = roll_lo_hi(50,110);
                    await settings_update(settings);
                }
            },
            four: {
                label: "Empty Chest",
                callback: () => {
                    d.render(true);
                    if (window.confirm("Do you really want to clear out chest?")) {
                        chest_clear();
                    }
                }
            }
        }
    });

async function settings_update(settings){
    await game.settings.set("MJMacros", "looter_settings", settings);
}


    /*
            two: {
                label: "Convert to gold",
                callback: () => {
                    convert_to_gold();
                    d.render(true);
                }
            },
    */

    d.render(true);
    //d.close = function(){}
}

//==================================== Foundry VTT Shortcuts ====================================
function selected(){ return canvas.tokens.controlled; }
function token(id_name){
    let token = canvas.tokens.get(id_name);
    //console.log("   1st token: ", token)
    //let token = canvas.tokens.children[0].getChildByName(id_name);
    if (token){
        //console.log("It must be by id: ", token);
        //token = canvas.tokens.children[0].getChildByName(id_name);
    } else if (token = canvas.tokens.children[0].getChildByName(id_name)){
        token = token = canvas.tokens.children[0].getChildByName(id_name);
        //console.log("I think it's by Name:", token);
    } else {
        return false;
    }
    token.deleteAllItems = async function(){
        let items_to_delete = [];
        for (let item of token.actor.items){
            //Queue up all items to copy to chest
            items_to_delete.push(item._id);
        }
        await token.actor.deleteEmbeddedDocuments("Item", items_to_delete );
    }
    token.deleteItems = async function(items_to_delete){
        //l("DeleteItems:", items_to_delete);
        await token.actor.deleteEmbeddedDocuments("Item", items_to_delete );
    }
    token.getItems = function(){
        let items = token.actor.items;
        for (let item of items){
            item.price = item.data.data.price;
            item.quantity = item.data.data.quantity;
            //console.log("price: " + item.price + ", quantity: " + item.quantity);
            item.total_value = (parseInt(item.data.data.price) * parseInt(item.data.data.quantity));
        }
        //console.log("items returned: ", items)
        return items;
    }
    token.updateItems = async function(updates){
        //l("UpdateItems:", updates);
        await token.actor.updateEmbeddedDocuments("Item", updates);
    }

    console.log(token);

    return token;
}
function l(header, obj){ console.log(header, obj); }
function info(str){ $("#div_statusbar").html(str); }
function warn(str){ ui.notifications.warn(str); }

/*
class mj == {
    async function create_token(doc){
        let scene = game.scenes.contents.find(sc => sc.id == sceneID);
        await scene.createEmbeddedDocuments("Token", [token]);
    }
}
*/