/*
    * Requires Loot sheet 5e

    ============================================================

    * Buttons to add:
        * Distribute coins evenly
            * Chat message for what each token gets
        * Sell selected items
            * Merchants never give full price
            * Re-Roll button
            * 

    * Functionality
        * Copy all items to Chest then delete all items from NPC
        * Stack Items = Yes
        * Convert GP item loot to actual gold pieces in the chest
        * Come up with way to spawn a chest when one does not exist
        * 

    ======================= Questions =======================
    ? Can we drag/drop items to/from merchant and have gp updated in source/destination token?


    ======================= V2.0 =======================
    * Set flag so it can't be looted more than once
    * Sell partials
       * Choose items to sell (checklist)


*/

console.clear();

main()
async function main(){
    console.clear();
    
    let d = new Dialog({
        title: "Looter",
        content: `Loot defeated enemies`,
        buttons: {
            one: {
                label: "Loot Selected NPCs",
                callback: () => npc_loot(),
                width: 50
            },
            two: {
                label: "Convert to gold",
                callback: () => convert_to_gold()
            },
            three: {
                label: "Clear out Chest",
                callback: () => chest_clear()
            }
        }
    });
    d.render(true);
    
    async function chest_clear(){
        let chest = canvas.tokens.children[0].getChildByName("Master Treasure Chest");
        let items_to_delete = [];
        for (let item of chest.actor.items){
            //Queue up all items to copy to chest
            items_to_delete.push(item._id);
        }
        await chest.actor.deleteEmbeddedDocuments("Item", items_to_delete );
        d.render(true);
    }
    async function convert_to_gold(){

        let chest = canvas.tokens.children[0].getChildByName("Master Treasure Chest");
        let items = [];
        let items_qty = [];
        let items_updates = [];
        let items_to_add_raw = [];
        let items_to_delete = [];
        let loot_value = 0;
        for (let item of chest.actor.items){
            if (item.type === "loot"){
                loot_value += (parseInt(item.data.data.price) * parseInt(item.data.data.quantity));
                items_to_delete.push(item._id);
            } else {
                console.log("item", item);
                let item_name = item.name;
                //console.log(items[item_name]);
                if (items_qty[item_name]){
                    console.log("item_name: " + item_name + " exists. Deleting one.");
                    items_qty[item_name]++;

                    //Adjust qty of 1st item
                    console.log("adjusting item: ", items[item_name])
                    items_updates.push({
                        _id:items[item_name], 
                        data:{
                            quantity: items_qty[item_name]
                        }
                    })
                    //Delete this item
                    items_to_delete.push(item._id);

                } else {
                    console.log("Adding item: " + item_name)
                    items_qty[item_name] = 1;
                    items[item_name] = item._id;
                }
            }
        }
        console.log(items_qty);
        console.log("items_updates: ", items_updates);
        await chest.actor.updateEmbeddedDocuments("Item", items_updates);
        await chest.actor.deleteEmbeddedDocuments("Item", items_to_delete );

        //Misc Loot
        items_to_add_raw.push({
            name: "Coins/Gems",
            type: "loot",
            data: {
                quantity: 1,
                price: loot_value,
            }
        });
        await chest.actor.createEmbeddedDocuments("Item", items_to_add_raw);

    }
    async function npc_loot(){
        //Find Master Chest
        console.log(canvas.tokens.children);
        //let chest = game.actors.getName("Master Treasure Chest");     //Works, but points to actor
        //let chest = canvas.tokens.children.find( token => token.name === "Master Treasure Chest");
        let chest = canvas.tokens.children[0].getChildByName("Master Treasure Chest");
        console.log(chest);

        for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
            let items_to_add = [];
            for (let item of token.actor.items){
                //Queue up all items to copy to chest
                //Copy only weapons and inventory items
                if (item.type === "weapon" || item.type === "equipment" || item.type === "loot"){
                    items_to_add.push(item.toObject());
                }
            }
            await chest.actor.createEmbeddedDocuments("Item", items_to_add);
        }

        //convert_to_gold();


        d.render(true);
    }
    
}




