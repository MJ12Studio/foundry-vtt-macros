/*
    * Requires Loot sheet 5e

    ============================================================

    * Buttons to add:
        * Distribute coins evenly
            * Chat message for what each token gets
        * Sell selected items
            * Merchants never give full price
            * Re-Roll button
        * Exclude non-magical items

    * Functionality
        * Copy all items to Chest then delete all items from NPC
        * Stack Items = Yes
        * Convert GP item loot to actual gold pieces in the chest
        * Come up with way to spawn a chest when one does not exist with image
        * Check for Loot Sheet 5e installation.

    ======================= Questions =======================
    ? Can we drag/drop items to/from merchant and have gp updated in source/destination token?


    ======================= V2.0 =======================
    * Set flag so it can't be looted more than once
    * Sell partials
       * Choose items to sell (checklist)


*/

console.clear();
dialog_main();
   
async function chest_clear(){
    let chest = canvas.tokens.children[0].getChildByName("Group Treasure Chest");
    let items_to_delete = [];
    for (let item of chest.actor.items){
        //Queue up all items to copy to chest
        items_to_delete.push(item._id);
    }
    await chest.actor.deleteEmbeddedDocuments("Item", items_to_delete );
    return 0;
}
async function inventory_stack(){
    let items = [];
    let items_qty = [];
    let items_updates = [];
    let items_to_add_raw = [];
    let items_to_delete = [];
    let loot_value = 0;
    let chestToken = canvas.tokens.children[0].getChildByName("Group Treasure Chest");
    for (let item of chestToken.actor.items){
        if (item.type === "loot"){
            loot_value += (parseInt(item.data.data.price) * parseInt(item.data.data.quantity));
            items_to_delete.push(item._id);
        } else {
            console.log("item", item);
            console.log("item qty", item.data.data.quantity);
            let item_name = item.name;
            //console.log(items[item_name]);
            if (items_qty[item_name]){
                console.log("item_name: " + item_name + " exists. Deleting one.");
                console.log("qty to add: ", item.data.quantity);
                items_qty[item_name] += item.data.data.quantity;

                //Adjust qty of 1st item
                console.log("adjusting item: ", items[item_name]);
                items_updates.push({
                    _id:items[item_name], 
                    data:{
                        quantity: items_qty[item_name]
                    }
                });
                //Delete this item
                items_to_delete.push(item._id);

            } else {
                console.log("Adding item: " + item_name);
                items_qty[item_name] = item.data.data.quantity;
                items[item_name] = item._id;
            }
        }
    }
    console.log(items_qty);
    console.log("items_updates: ", items_updates);
    await chestToken.actor.updateEmbeddedDocuments("Item", items_updates);
    await chestToken.actor.deleteEmbeddedDocuments("Item", items_to_delete );

    //Misc Loot
    items_to_add_raw.push({
        name: "Coins/Gems",
        type: "loot",
        data: {
            quantity: 1,
            price: loot_value,
        }
    });
    await chestToken.actor.createEmbeddedDocuments("Item", items_to_add_raw);

    //End
    console.log("Inventory Stacked!");
    return 0;
}

async function npc_loot(opt){
    //Make sure some NPCs are selected
    if (canvas.tokens.controlled.length > 0){
        console.log("#NPCs:",canvas.tokens.controlled.length);
    } else {
        console.log("No NPCs selected to loot!");
        return 0;
    }
    //Find Master Chest
    console.log(canvas.tokens.children);
    //let chest = game.actors.getName("Master Treasure Chest");     //Works, but points to actor
    //let chest = canvas.tokens.children.find( token => token.name === "Master Treasure Chest");
    let chestToken = canvas.tokens.children[0].getChildByName("Group Treasure Chest");
    if (!chestToken){
        console.log("Creating Group Treasure Chest token");
    
        //Figure out where to place a chest. Grid placement is based on 50X50 spacing
        let maxX = 0;
        let maxY = 0;
        let sceneID = "";
        for (let token of canvas.tokens.controlled){
            if (token.x > maxX){ maxX = token.x; }
            if (token.y > maxY){ maxY = token.y; }
            sceneID = token.scene._id;
        }
        //Create actor (if necessary);
        let actor = game.actors.getName("Group Treasure Chest");
        if (!actor){
            console.log("Creating Group Treasure Chest actor");
            actor = await Actor.create({
                name: "Group Treasure Chest",
                type: "npc",
                img: "icons/containers/chest/chest-reinforced-steel-walnut-brown.webp",
                sheet: "LootSheet5eNPC"
            });
        } else {
            console.log("Group Treasure Chest actor exists!");
        }

        console.log("actor before token:", actor);

        let token = {
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
        
        let scene = game.scenes.contents.find(sc => sc.id == sceneID);
        await scene.createEmbeddedDocuments("Token", [token]);
    } else {
        console.log("Group Treasure Chest Token exists!!!");
    }

    chestToken = canvas.tokens.children[0].getChildByName("Group Treasure Chest");
    console.log(chestToken);

    for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
        let items_to_add = [];
        for (let item of token.actor.items){
            //Queue up all items to copy to chest
            //Copy only weapons and inventory items
            if (item.type === "weapon" || item.type === "equipment" || item.type === "loot"){
                items_to_add.push(item.toObject());
            }
        }
        await chestToken.actor.createEmbeddedDocuments("Item", items_to_add);
    }

    //Combine inventory items if possible
    inventory_stack();
    return 0;
}
 
function dialog_main(){
    let opt = [];
    let d = new Dialog({
        title: "Looter",
        content: `
            <div><label>Exclude Non-Magic Items:</label>     <input id='opt_exclude_non_magic' type='checkbox' checked /></div>
        `,
        buttons: {
            one: {
                label: "Loot Selected NPCs",
                callback: () => {
                    opt.exclude_non_magic = document.getElementById("opt_exclude_non_magic").checked;
                    npc_loot(opt);
                    d.render(true);
                },
                width: 50
            },
            three: {
                label: "Clear out Chest",
                callback: () => {
                    chest_clear();
                    d.render(true);
                }
            }
        }
    });

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
}




