/*
    Humanoids, Non-humanoids special additions
        *Features - build in some logic for who gets what
            Auras:
                "Dark Aura","Death Burst","Fear Aura","Fetid Cloud","Fire Aura"
            
            Attacks:
                Low-Level:  "Acid Spray","Aggressive","Brave","Charge","Cunning Action","Dreadful Glare","Enlarge","Fling","Frost Breath","Heated Body"
            
                Medium-level: "Assassinate","Blinding Breath","Blood Frenzy","Deadly Leap","Disrupt Life","Firat Roar","Frightening Gaze","Haste","Healing Touch"
            
                High-Damage: "Acid Breath","Channel Negative Energy","Cold Breath","Death Throes","Ethereal Jaunt","Fire Breath","Frightful Presence"
            
            *Defense/Immunities:
                "Acid Absorption","Dark Devotion","Evasion","Fire Absorption","Heal Self","Horrific Appearance"

    * Senses/Skills
        "Amphibious","Devil Sight", "Ethereal Sight","Freedom of Movement","Hold Breath"

    ==============================================
    * More tweaking settings/buttons may mean less code
                                    +'s                   %Chance to have
        Weapons:  [ ] Allow Magic   [CR / 8]                (0-100%)
                                    [Very Little (10CR/+)]

        Armor:    [ ] Allow Magic   [CR / +]
        Shield:   [ ] Allow Shield  [CR / +]
        Magic Items [ ] 

        Use Luck [ ]
        Use Social Status [ ]


    * Hover information for options

*/
console.clear();

//Constants for tweaking scale settings
const ABILITY_LEVEL_PER_PLUS = 3;
const GEM_BASE_PERCENT = 50;
const LEVEL_PER_PLUS_ARMOR_SHIELD_WEAPON = 16;
//const LEVEL_PER_PLUS_ARMOR = 10;
//const LEVEL_PER_PLUS_SHIELD = 10;
//const LEVEL_PER_PLUS_WEAPON = 10;
const NPC_HIT_DIE = 12;
const TAB = "&nbsp;&nbsp;&nbsp;&nbsp;";

if (canvas.tokens.controlled.length == 0){ alert("Please select at least one NPC!"); return;}

dialog_start();
async function main(opt){
    opt.npc_count = await npc_count_get();
    opt.party_level_average = await party_level_average_get()

    opt.tweak_factor = 1;

    for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
        if (token.actor.type != "npc"){ continue; } //Skip it if it's not an npc

        let AD   = "actorData.data.";                       //Used for WRITING data to token. Foundry Data
        let TADD = token.actor.data.data;                   //Used for READING data from token. Foundry Data

        //Setup temp array for processing current token
        let tad  = [];
        tad.bio_narrative = [];
        tad.bio_traits = [];
        tad.bio_updates = [];
        tad.item_types_to_delete = [];
        tad.items_to_add_compendium = [];
        tad.items_to_add_raw = [];
        tad.items_to_delete = [];
        tad.movement = [];
        tad.opt = opt;

        //Get/set original data
        let original_actorData = TADD.original_actorData;
        let actorData_updates = [];
        if (!original_actorData){
            original_actorData = await token.actor.data;
            actorData_updates["actorData.data.original_actorData"] = original_actorData;
        }

        //Scale basic token info
        tad.cr = TADD.details.cr;
        tad.cr_orig = original_actorData.data.details.cr;
        if (tad.cr < 1){ tad.cr = 1; }
        tad.cr_new = tad.cr + tad.opt.cr_change;
        if (tad.cr_new < 1){ tad.cr_new = 1; }
        actorData_updates[AD+"details.cr"] = tad.cr_new;
        tad.cr_change_since_orig = Math.round(tad.cr_new - tad.cr_orig);

        //Misc Token info
        tad.alignment = TADD.details.alignment;
        tad.gender = gender_get();
        tad.name = token.actor.data.token.name;
        tad.race = TADD.details.race;
        tad.type = TADD.details.type.value;
        tad.is_humanoid = is_humanoid(tad);     tad.bio_traits.push(["Humanoid", tad.is_humanoid]);
        tad.max_spell_level = spell_level_get_max(tad.cr_new);
        tad.spellcaster_type = TADD.attributes.spellcasting;
        tad.bio_updates.push(["CR", original_actorData.data.details.cr, tad.cr_new]);
        tad.bio_traits.push(["Gender", tad.gender]);

        //Social Status, Luck
        //tad.social_status = social_status_get(token,tad);
        tad.social_status = roll_bell_curve_1000(TADD.abilities.cha.mod * 2);
        tad.luck = roll_bell_curve_1000();
        tad.xp = experience_points_get(tad.cr_new);
        tad.adjusted_cr = Math.round(tad.cr_new * tad.social_status * tad.luck);    //Rounds up if >= 0.5
        tad.bio_traits.push(["Luck factor", tad.luck]);
        tad.bio_traits.push(["Social Status factor", tad.social_status]);
        tad.starting_gold = (Math.round((tad.xp/2) * opt.tweak_factor * tad.social_status * tad.luck)) + roll_simple(tad.adjusted_cr);
        l(tad);

        //Read in template
        tad.template = await template_choose(tad);

        //Abilities Adjust
        tad.con = original_actorData.data.abilities.con.value;
        if (tad.opt.adjust_abilities){
            for (let ability of tad.template.abilities){
                let orig_ability = original_actorData.data.abilities[ability].value;
                
                console.log("orig ability: " + ability + " : " + orig_ability);
                
                let new_value = orig_ability + Math.round(tad.cr_change_since_orig/ABILITY_LEVEL_PER_PLUS);
                actorData_updates[AD+"abilities." + ability + ".value"] = new_value;
                tad.bio_updates.push([ability.capitalize(), orig_ability, new_value]);
                if (ability == "con"){ tad.con = new_value; }
            }
        }

        //Clear AC Flat Value
        actorData_updates[AD+"attributes.ac.flat"] = null;

        //HP Adjust
        if (opt.adjust_hp){
            let hp = TADD.attributes.hp.max;
            tad.hp = (tad.cr_new * NPC_HIT_DIE) + (parseInt((tad.con - 10) / 2) * tad.cr_new);
            tad.bio_updates.push(["HP", original_actorData.data.attributes.hp.max, tad.hp]);
            actorData_updates[AD+"attributes.hp.max"] = tad.hp;
        }

        //Do some things based on humanoid/non-humanoid
        if (!tad.is_humanoid){
            //Movement Adjust: Adjust up or down by 1 foot per CR 
            for (let m of ["burrow","climb","fly","swim","walk"]){
                console.log(original_actorData);
                let cur_m = original_actorData.data.attributes.movement[m];
                if (cur_m > 0){
                    tad.movement[m] = Math.round(cur_m + tad.cr_new);
                    actorData_updates[AD+"attributes.movement." + m] = tad.movement[m];
                    tad.bio_updates.push([m.capitalize(), cur_m + "'", tad.movement[m] + "'"])
                }
            }
        } else {
            console.log("Is Humanoid");
            if (tad.opt.clear_armor){    tad.item_types_to_delete.push("equipment"); }
            if (tad.opt.clear_spells){   tad.item_types_to_delete.push("spell"); }
            if (tad.opt.clear_weapons){  tad.item_types_to_delete.push("weapon"); }
        }

        //NPC Equip
        if (tad.is_humanoid){ npc_equip(tad); }

        /*
        //Items Adjust
        tad.has_armor = false
        tad.has_shield = false;
        tad.has_weapon = false;
        for (let item of token.actor.items){
            if (tad.is_humanoid){
                //console.log("   isHumanoid!");
                //Weapons / Armor
                if (item.type === "weapon"){
                    //console.log("   weapon")
                    tad.has_weapon = true;
                    let new_name = "";
                    let weapon_plus = await item_plus_get(tad);
                    //l("Weapon_plus: " + weapon_plus);
                    if (weapon_plus > 0){
                        new_name = " +" + weapon_plus;                        
                    }
                    let weapon = "";
                    if (item.data.data.properties.two){
                        //console.log("   two-handed weapon")
                        if (item.name.indexOf("bow") > -1){
                            //console.log("   bow")
                            //Add a bow
                            //let n = tad.template.weapons_2_handed_range.length;
                            //let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_2_handed_range.random();
                        } else {
                            //console.log("   non-range weapon")
                            //Add a hand weapon
                            //let n = tad.template.weapons_2_handed.length;
                            //let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_2_handed.random();
                        }
                    } else {
                        //console.log("   one-handed weapon")
                        if (item.data.data.properties.amm || item.data.data.properties.thrown){
                            //Add a ranged one-handed weapon
                            //console.log(tok.template.weapons_1_handed_range)
                            //console.log(tok);
                            //let n = tad.template.weapons_1_handed_range.length;
                            //let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_1_handed_range.random();
                        } else {
                            //Add a non-ranged one handed weapon
                            //console.log(tok.template.weapons_1_handed)
                            //console.log(tok);
                            //let n = tad.template.weapons_1_handed.length;
                            //let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_1_handed.random();  
                            //Add a shield?
                            if (tad.template.class == "Fighter"){
                                tad.has_shield = true;
                            }
                        }
                    }
                    new_name = weapon + new_name;
                    tad.items_to_add_compendium.push(["dnd5e.items", new_name])
                    tad.bio_narrative.push("Was given a weapon: " + new_name + ". ");
                } else {
                    //console.log(item);
                    //l("Armor", item.data.data.armor)
                    if (item.data.data.armor && !item.name.indexOf("Shield")){
                        tad.has_armor = true;
                        let armor_plus_str = await armor_get(tad);
                        tad.items_to_add_compendium.push(["dnd5e.items", armor_plus_str])
                    }
                }
                
            } else {
                //console.log("Non-Humanoid");
                if (item.type === "weapon"){
                    tad.items_updates = [];
                    let original_damage = item.data.data.original_damage;
                    //console.log("Original original_damage: " + original_damage);
                    if (!original_damage){
                        //console.log("NO original_damage")
                        tad.items_updates.push({
                            _id:item.id,
                            data: {
                                original_damage: item.data.data.damage.parts[0][0]
                            }
                        });
                        original_damage = item.data.data.damage.parts[0][0];
                    }
                    //console.log("Original Damage: " + original_damage);

                    let dPos = original_damage.indexOf("d");
                    let d = parseInt(original_damage.substr(0,dPos));
                    if (d > 0){
                        //console.log("D: " + d);
                        let newD = d + Math.round(tad.cr_change_since_orig/2);
                        //console.log("newD: " + newD);
                        if (d + newD < 0){ newD = 1; }
                        let new_damage = newD + original_damage.substr(dPos,1000);
                        //console.log("new_damage: " + new_damage);
                        let damage_type = item.data.data.damage.parts[0][1]
                        let data = item.data.data;
                        //console.log(data);
                        data.damage.parts[0][0] = new_damage;
                        data.damage.parts[0][1] = damage_type;
                        tad.items_updates.push({
                            _id:item.id,
                            data: data
                        });
                    }
                    await token.actor.updateEmbeddedDocuments("Item", tad.items_updates);
                }
            }
            if (item.type === "feat"){
                if (is_humanoid && tad.template.has_multiattack && item.name.indexOf("Multiattack") > -1){
                    await token.actor.deleteEmbeddedDocuments( "Item", [item.id] );
                }
            }
        }

        //Has Shield?
        if (tad.has_shield){
            let shield_plus = await item_plus_get(tad);
            l("shield_plus: " + shield_plus);
            if (shield_plus > 0){
                tad.shield_name = "Shield +" + shield_plus;
            } else {
                tad.shield_name = "Shield";
            }
            tad.items_to_add_compendium.push(["dnd5e.items", tad.shield_name])
            tad.bio_narrative.push("Was given a " + tad.shield_name + ". ");
        }

        //Add armor for Humanoids without armor
        if (!tad.has_armor && tad.is_humanoid && tad.template.armor != "None"){
            let armor_plus_str = await armor_get(tad);
            tad.items_to_add_compendium.push(["dnd5e.items", armor_plus_str])
        }

        //Add weapons for Humanoids without weapons
        if (!tad.has_weapon && tad.is_humanoid){
            await weapon_add(tad, tad.template.weapons_2_handed_range);
            await weapon_add(tad, tad.template.weapons_1_handed);
        }
        */

        //Does multi-Attack need added?
        if (is_humanoid && tad.template.has_multiattack){
            if (tad.cr_new > 2){
                if (tad.cr_new > 11){
                    feat_add_queue(tad, "Multiattack (3 Attacks)", "The NPC gets 3 melee attacks.");
                } else {
                    feat_add_queue(tad, "Multiattack (2 Attacks)", "The NPC gets 2 melee attacks.");
                }
            }
        } else {
            // No need to touch or add multiattacks for Non-Humanoids!!!
        }

        //Add spells for spellcasters
        if (tad.spellcaster_type){
            for (let level = 1; level <= tad.max_spell_level; level++){
                for (let spell of tad.template.spell_list[level]){
                    tad.items_to_add_compendium.push(["dnd5e.spells", spell]);
                }
            }
            actorData_updates[AD+"details.spellLevel"] = tad.cr_new;
        }
        
        //Loot
        //if (tad.opt.adjust_loot && tad.is_humanoid){
        //    tad.item_types_to_delete.push("loot");
        //    loot_generate(tad);
        //}

        //Update biography
        tad.bio = original_actorData.data.details.biography.value + "<br><hr>";
            console.log("Before Biography Update");
        
        await biography_update(tad);
        actorData_updates[AD+"details.biography.value"] = tad.bio;

            console.log("After Biography Update");
            console.log("Before Token.document.update");

        await token.document.update(actorData_updates);
            console.log("After Token.document.update");
            console.log("Before item_types_remove");
        
        await item_types_remove(token, tad);                //Remove all selected item types
        
        console.log("After item_types_remove");
        console.log("Before items_add");
        
        await items_add(token, tad);                        //Add all items
        
        console.log("After items_add");
        console.log("Before items_equip_all");
        
        await items_equip_all(token);                       //Equip, identify, make proficient all items
        
        console.log("After items_equip_all");
        console.log("Before longRest");
        
        await token.actor.longRest({ dialog: false });      //Refresh spellslots and hp
        
        console.log("After longRest");

        console.log(tad);
        console.log(original_actorData)
        console.log(token.actor);
    }
    console.log("Finished processing tokens...");
}

/*=================================================================
    Functions
  =================================================================*/
async function armor_get(tad){
    let armor = [];
    //armor.push("None");                     // 10 0
    //armor.push("Padded Armor");             // 11 1
    //armor.push("Leather Armor");            // 11 2
    //armor.push("Studded Leather Armor");    // 12 3
    //armor.push("Hide Armor");               // 12 4
    //armor.push("Chain Shirt");              // 13 5
    //armor.push("Breastplate");              // 14 6
    //armor.push("Ring Mail");                // 14 7
    //armor.push("Scale Mail");               // 14 8
    //armor.push("Half Plate Armor");         // 15 9
    //armor.push("Chain Mail");               // 16 10
    //armor.push("Splint Armor");             // 17 11
    //armor.push("Plate Armor");              // 18 12
    let armor_number = 0;
    armor["None"]   = [];
    armor["Light"]  = ["Padded Armor","Leather Armor","Studded Leather Armor"];
    armor["Medium"] = ["Padded Armor","Leather Armor","Studded Leather Armor","Hide Armor","Chain Shirt","Scale Mail","Breastplate","Half Plate Armor"];
    armor["Heavy"]  = ["Padded Armor","Leather Armor","Studded Leather Armor","Hide Armor","Chain Shirt","Scale Mail","Breastplate","Half Plate Armor","Ring Mail","Chain Mail","Splint Armor","Plate Armor"];

    let armor_string = armor[tad.template.armor].random();

    let armor_plus = await item_plus_get(tad);
    //l("armor_plus: " + armor_plus);
    let armor_str = "";
    if (armor_plus > 0){
        armor_str = armor_string + " +" + armor_plus;
    } else {
        armor_str = armor_string;
    }
    tad.bio_narrative.push("Was given armor: " + armor_str + ". ");
    return armor_str;
}
async function biography_update(tad){
    tad.bio += "<table border=0 cellpadding=0 cellspacing=0 width=100%>";
    tad.bio += "<tr><td valign=top width=50%>";
    tad.bio += "        <table border=0 cellpadding=0 cellspacing=0>"
    tad.bio += "            <tr><td colspan=3><center><b><u>Updates</u></b></td></tr>";
    tad.bio += "            <tr><td></td><td><center>Original</center></td><td><center>Current</center></td></tr>";
    for (let update of tad.bio_updates){
        tad.bio +=         "<tr><td>" + update[0] + "</td>";
        tad.bio +=         "    <td><center>" + update[1] + "</center></td>";
        tad.bio +=         "    <td><center>" + update[2] + "</center></td>";
        tad.bio +=         "</tr>";
    }
    tad.bio += "        </table>";
    tad.bio += "</center></td><td valign=top width=50%>";
    tad.bio += "        <table border=0 cellpadding=0 cellspacing=0>"
    tad.bio += "            <tr><td colspan=3><center><b><u>Misc Info</u></b></td></tr>";
    for (let trait of tad.bio_traits){
        tad.bio +=         "<tr><td>" + trait[0] + "</td><td>" + trait[1] + "</td></tr>";
    }
    tad.bio += "        </table>";
    tad.bio += "</center></td></td></table><br>";
    for (let narr of tad.bio_narrative){
        tad.bio += narr;
    }
}
function feat_add_queue(tad, name, description){
    tad.items_to_add_raw.push({
        name: name,
        type: "feat",
        data: {
            description: {
                value: description
            }
        }
    });
}
function gender_get(){
    return ["Male","Female"].random();
}
function is_humanoid(tad){
    if (["celestial","fiend","fey","giant","humanoid"].includes(tad.type.toLowerCase()) || ["centaur","drider","ghast","ghoul","lich","medusa","merrow","minotaur","minotaur skeleton","mummy lord","ogre zombie","skeleton","vampire","vampire spawn","wight","zombie"].includes(tad.name.toLowerCase())){
        return true;
    } else {
        return false;
    }
}
async function item_plus_get(tad){
    //l("tad.adjusted_cr: " + tad.adjusted_cr);
    let roll = roll_simple(100);
    //l(" Roll = " + roll)
    switch(true){
        case (tad.adjusted_cr < 8):
            let percent_a = Math.round((tad.adjusted_cr / LEVEL_PER_PLUS_ARMOR_SHIELD_WEAPON) * 100);
            //l(" percent_a: " + percent_a);
            if(roll <= percent_a){ return 1; } else { return 0; }
            break;
        case (tad.adjusted_cr < 15):
            let percent_s = Math.round(((tad.adjusted_cr - LEVEL_PER_PLUS_ARMOR_SHIELD_WEAPON) / LEVEL_PER_PLUS_ARMOR_SHIELD_WEAPON) * 100);
            //l(" percent_s: " + percent_s);
            if(roll <= percent_s){ return 2; } else { return (roll_simple(2)-1); }
            break;
        default:
            let percent_w = Math.round(((tad.adjusted_cr - 14) / 6) * 100);
            //l(" percent_w: " + percent_w);
            if(roll <= percent_w){ return 3; } else { return (roll_simple(3)-1); }
    }
}
async function item_types_remove(token, tad){
    for (let i of token.actor.items){
        //console.log(i.name + " : " + i.type)
        if (tad.item_types_to_delete.includes(i.type)){
            tad.items_to_delete.push(i._id);
        }
    }
    await items_delete(token, tad.items_to_delete)
}
async function items_add(token, tad) {
    console.log(tad.items_to_add_compendium)
    for (let i of tad.items_to_add_compendium){
        let pack = await game.packs.get(i[0]);
        let index = await pack.getIndex();
        let entry = await index.find(e => e.name === i[1]);
        let entity = await pack.getDocument(entry._id);
        tad.items_to_add_raw.push(entity.data.toObject());
    }
    await token.actor.createEmbeddedDocuments("Item", tad.items_to_add_raw);
}
async function items_delete(token, items){
    await token.actor.deleteEmbeddedDocuments( "Item", items );
}
async function items_equip_all(token){
    let items_updates = [];
    for (let item of token.actor.items){
        if (item.type == "equipment" || item.type == "weapon"){
            items_updates.push({
                _id:item.id, 
                data:{
                    equipped: true,
                    identified: true,
                    proficient: true
                }
            })
            console.log("item.name:", item.name);
            //await item_equipped_identified_proficient(token, i)
        }
    }
    await token.actor.updateEmbeddedDocuments("Item", items_updates);
    //item_equipped_identified_proficient(token, items_updates);
}
/*
async function item_equipped_identified_proficient(token, item){
    await token.actor.updateEmbeddedDocuments("Item", [{
        _id:item.id, 
        data:{
            equipped: true,
            identified: true,
            proficient: true
        }
        }]
    );
}
*/
async function items_update(token, updates){
    console.log(updates);
    await token.actor.updateEmbeddedDocuments("Item", updates);
}
function loot_add_queue(tad, name, quantity, price, img){
    tad.items_to_add_raw.push({
        name: name,
        type: "loot",
        data: {
            quantity: quantity,
            price: price,
        },
        img:img
    });
}
async function loot_generate(tad){
    tad.item_types_to_delete.push("loot");
    /*
    tad.base_gp = Math.round((Math.round(tad.xp/10) * tad.social_status * tad.luck) + roll_simple(tad.adjusted_cr));    
    */
    //tad.base_gp = Math.round((Math.round(tad.xp/10) * tad.social_status * tad.luck) + roll_simple(tad.adjusted_cr));
    let gem_percent = GEM_BASE_PERCENT + roll_simple((100 - GEM_BASE_PERCENT));
    let gem_value = Math.round(tad.starting_gold * (gem_percent/100));
    let gem_qty = roll_simple(tad.cr_new);
    let gp_value = tad.starting_gold - gem_value;
    
    //Simple loot uses svg icons; Magic loot uses full color icons

    if (gem_value > 0){
        loot_add_queue(tad, "Gems (" + gem_value + " gp value)", gem_qty, parseInt(gem_value/gem_qty), "icons/svg/item-bag.svg");
    }
    if (gp_value > 0){
        loot_add_queue(tad, "Gold Pieces (" + gp_value + ")", gp_value, 1, "icons/svg/coins.svg");
    }
}
function npc_count_get(){
    let npc_count = 0;
    for (let t of canvas.tokens.controlled){
        npc_count++;
    }
    return npc_count;
}
function npc_equip(tad){
    console.log("npc_equip()")
    /*Figure out what items a NPC has based on their starting_gold
    Weapon, Armor, Shield my be simpler to start with non-magic item and scale up
    * Get standard version
    * Buy +
    *   Armor   1500, 6000, 24000
    *   Shield  2000, 6000, 24000
    *   Weapon  1000, 4000, 16000

    */
    switch(tad.template.class){
        case "Fighter":
            console.log("Fighter!");
            npc_equip_weapons_normal(tad);
            npc_equip_weapons_magic(tad);
            npc_equip_armor(tad);
            break;
        case "Cleric":
            npc_equip_weapons_normal(tad);
            npc_equip_weapons_magic(tad);
            npc_equip_armor(tad);
            break;
        case "Wizard":
            npc_equip_weapons_normal(tad);
            npc_equip_misc_magic(tad);
            npc_equip_weapons_magic(tad);
    }
    //Loot
    tad.starting_gold = parseInt(tad.starting_gold/10);
    loot_generate(tad);
}
function npc_equip_armor(tad){
    let armor = [];
    armor["None"]   = [];
    armor["Light"]  = ["Padded Armor","Leather Armor","Studded Leather Armor"];
    armor["Medium"] = ["Padded Armor","Leather Armor","Studded Leather Armor","Hide Armor","Chain Shirt","Scale Mail","Breastplate","Half Plate Armor"];
    armor["Heavy"]  = ["Padded Armor","Leather Armor","Studded Leather Armor","Hide Armor","Chain Shirt","Scale Mail","Breastplate","Half Plate Armor","Ring Mail","Chain Mail","Splint Armor","Plate Armor"];
    tad.armor = armor[tad.template.armor].random();

    //Buy Armor with starting gold
    if (tad.starting_gold > 24000){
        tad.starting_gold -= 24000;
        tad.armor += " +3";
        //+3 weapon
    } else if (tad.starting_gold > 6000){
        //+2 Weapon
        tad.starting_gold -= 6000;
        tad.armor += " +2";
    } else if (tad.starting_gold > 1500){
        //+1 Weapon
        tad.starting_gold -= 1500;
        tad.armor += " +1";
    }
    tad.items_to_add_compendium.push(["dnd5e.items", tad.armor]);
    if (tad.melee_handed == 1){
        tad.shield = "Shield";
        //Buy Armor with starting gold
        if (tad.starting_gold > 24000){
            tad.starting_gold -= 24000;
            tad.shield += " +3";
            //+3 weapon
        } else if (tad.starting_gold > 6000){
            //+2 Weapon
            tad.starting_gold -= 6000;
            tad.shield += " +2";
        } else if (tad.starting_gold > 2000){
            //+1 Weapon
            tad.starting_gold -= 2000;
            tad.shield += " +1";
        }
        tad.items_to_add_compendium.push(["dnd5e.items", tad.shield]);
    }
}
function npc_equip_weapons_normal(tad){
    //Get a melee and a range weapon
    if (roll_simple(2) == 1){
        tad.melee_handed = 1;
        tad.weapon_1 = tad.template.weapons_1_handed.random();
    } else {
        tad.melee_handed = 2;
        tad.weapon_1 = tad.template.weapons_2_handed.random();
    }
    if (roll_simple(2) == 1){
        tad.weapon_2 = tad.template.weapons_1_handed_range.random();
    } else {
        tad.weapon_2 = tad.template.weapons_2_handed_range.random();
    }
}
function npc_equip_weapons_magic(tad){
    //Buy Weapon with starting gold
    if (tad.starting_gold > 16000){
        tad.starting_gold -= 16000;
        if (roll_simple(2) == 1){
            tad.weapon_1 += " +3";
        } else {
            tad.weapon_2 += " +3";
        }
        //+3 weapon
    } else if (tad.starting_gold > 4000){
        //+2 Weapon
        tad.starting_gold -= 4000;
        if (roll_simple(2) == 1){
            tad.weapon_1 += " +2";
        } else {
            tad.weapon_2 += " +2";
        }
    } else if (tad.starting_gold > 1000){
        //+1 Weapon
        tad.starting_gold -= 1000;
        if (roll_simple(2) == 1){
            tad.weapon_1 += " +1";
        } else {
            tad.weapon_2 += " +1";
        }
    }
    tad.items_to_add_compendium.push(["dnd5e.items", tad.weapon_1]);
    tad.items_to_add_compendium.push(["dnd5e.items", tad.weapon_2]);
}
function npc_equip_misc_magic(tad){
    //Scramble misc_items
    tad.template.misc_magic.shuffle();
    for (let item of tad.template.misc_magic){
        if (item.price <= tad.starting_gold){
            tad.items_to_add_compendium.push(["dnd5e.items", item.id]);
            tad.starting_gold -= item.price;
        }
    }

}
function npc_equip_loot(tad){

}

function party_level_average_get(){
    let party_count = 0;
    let party_level_total = 0;
    for (let t of canvas.tokens.placeables){
        if (t.actor){
            let a = game.actors.get(t.actor.id);
            if (a.data.type){
                if (a.data.type != "npc"){
                    party_count++;
                    for (const [key, value] of Object.entries(a.data.data.classes)) {
                        party_level_total += value.levels;
                    }
                }
            }
        }
    }
    return Math.round(party_level_total / party_count);
}
function roll_bell_curve_1000(adder = 0){
    let roll = roll_simple(1000) + adder;
    switch(true){
        case (roll<5):   return 0.25; //1-4         4/1000   =  0.4%
        case (roll<21):  return 0.50; //5-20        16/1000  =  1.6%
        case (roll<161): return 0.75; //21-160      140/1000 = 14.0%
        case (roll<841): return 1.00; //161-840     680/1000 = 68.0%
        case (roll<981): return 1.25; //861-980     140/1000 = 14.0%
        case (roll<997): return 2.00; //981-996     16/1000  =  1.6%
        default:         return 4.00; //997-1000    4/1000   =  0.4%
    }
}
function roll_simple(d){
    return Math.floor(Math.random() * d) + 1
}
function roll_no1_no2(qty, d){
    let total = 0;
    for (let i = 0; i < qty; i++){
        let r = Math.floor(Math.random() * d) + 1
        if (r < 3){ r = 3; }
        total = total + r;
    }
    return total;
}
function spell_level_get_max(cr){
    let l = 0;
    if (cr >0) l = 1;
    if (cr >2) l = 2;
    if (cr >4) l = 3;
    if (cr >6) l = 4;
    if (cr >8) l = 5;
    if (cr >10) l = 6;
    if (cr >12) l = 7;
    if (cr >14) l = 8;
    if (cr >16) l = 9;
    return l;
}
async function template_choose(tad){
    let template = [];
    let type = tad.opt.template_str;

    //Even if "generic" was chosen, use some sense to figure out what kind of NPC we are dealing with
    if (tad.is_humanoid){
        //Figure out if npc can cast spells
        if (tad.spellcaster_type){
            if (tad.spellcaster_type == "wis"){
                template.class = "cleric";
                template.has_multiattack = false;
            } else {
                template.class = "wizard";
                template.has_multiattack = false;
            }            
        } else {
            template.class = "fighter";
            template.has_multiattack = true;
        }
        template.loot_class = "humanoid";
    } else {
        //Non-Humanoid
        template.class = "non-humanoid";
        template.has_multiattack = false;
        if (tad.type == "Beast"){
            template.loot_class = "beast";
        } else {
            template.loot_class = "non-humanoid";
        }
    }
    //console.log("Template class: " + template.class);

    switch(template.class){
        case "cleric":
            template.class = "Cleric";
            template.abilities = ["con","dex","wis"];
            template.spell_list = [
                ["Light"],
                ["Cure Wounds","Healing Word","Inflict Wounds","Protection from Evil and Good","Sanctuary","Shield of Faith"],
                ["Aid","Blindness/Deafness","Hold Person","Lesser Restoration","Prayer of Healing","Silence","Spiritual Weapon"],
                ["Animate Dead","Bestow Curse","Dispel Magic","Glyph of Warding","Mass Healing Word","Magic Circle","Meld into Stone","Revivify","Water Walk"],
                ["Banishment","Control Water","Death Ward","Freedom of Movement","Guardian of Faith","Stone Shape"],
                ["Contagion","Dispel Evil and Good","Geas","Greater Restoration","Insect Plague","Mass Cure Wounds","Raise Dead"],
                ["Blade Barrier","Create Undead","Harm","Heal","Word of Recall"],
                ["Conjure Celestial","Divine Word","Etherealness","Fire Storm","Plane Shift","Regenerate","Resurrection"],
                ["Antimagic Field","Control Weather","Earthquake"],
                ["Gate","Mass Heal","True Resurrection"]
            ];
            template.armor = "Medium";
            template.weapons_1_handed = ["Battleaxe","Flail","Handaxe","Light Hammer","Longsword","Mace","Morningstar","Scimitar","Shortsword","Sickle","War Pick","Warhammer"];
            template.weapons_2_handed = ["Glaive","Greataxe", "Greatsword","Halberd","Maul","Pike","Spear","Trident"];
            template.weapons_1_handed_range = ["Hand Crossbow"];
            template.weapons_2_handed_range = ["Light Crossbow","Shortbow"];
            break;
        case "fighter":
            template.class = "Fighter";
            template.abilities = ["dex","wis","str"];
            template.spell_list= [];
            template.armor = "Heavy";
            template.weapons_1_handed = ["Battleaxe","Flail","Handaxe","Light Hammer","Longsword","Mace","Morningstar","Rapier","Scimitar","Shortsword","Sickle","War Pick","Warhammer","Whip"];
            template.weapons_2_handed = ["Glaive","Greataxe", "Greatsword","Halberd","Maul","Pike","Spear","Trident"];
            template.weapons_1_handed_range = ["Blowgun","Hand Crossbow","Shortbow","Sling"];
            template.weapons_2_handed_range = ["Heavy Crossbow","Javelin","Longbow","Light Crossbow"];
            break;
        case "non-humanoid":
            template.class = "Non-Humanoid";
            template.abilities = ["con","dex","str"];
            template.spell_list= [];
            break;
        case "wizard":
            template.class = "Wizard";
            template.abilities = ["con","dex","int"];
            template.misc_magic = [
                {id:"Amulet of Health",     price: 4000},
                {id:"Boots of Speed",       price: 4000},
                {id:"Headband of Intellect",price: 8000},
                {id:"Ring of Protection",   price: 3500},
                {id:"Ring of Warmth",       price: 1000}
            ];
            template.spell_list = [
                ["Chill Touch","Poison Spray","Ray of Frost"],
                ["Burning Hands","Feather Fall","Mage Armor","Magic Missile","Sleep"],
                ["Darkness","Detect Thoughts","Hold Person","Invisibility","Knock","Ray of Enfeeblement","Scorching Ray","See Invisibility","Spider Climb","Web","Levitate"],
                ["Animate Dead","Dispel Magic","Fear","Fireball","Fly","Haste","Lightning Bolt","Slow","Vampiric Touch"],
                ["Banishment","Black Tentacles","Greater Invisibility","Ice Storm","Phantasmal Killer","Stoneskin","Wall of Fire"],
                ["Cloudkill","Cone of Cold","Dominate Person","Teleportation Circle","Wall of Force"],
                ["Chain Lightning","Circle of Death","Disintegrate", "Globe of Invulnerability"],
                ["Finger of Death","Plane Shift","Reverse Gravity","Teleport"],
                ["Mind Blank","Maze","Power Word Stun"],
                ["Imprisonment","Meteor Swarm","Power Word Kill"]
            ];
            template.armor = "None";
            template.weapons_1_handed = ["Dagger","Dart"];
            template.weapons_2_handed = ["Quarterstaff"];
            template.weapons_1_handed_range = ["Dart","Sling"];
            template.weapons_2_handed_range = ["Light Crossbow"];
            break;
    }
    //console.log(template);
    return template;
}
async function token_update(token, tok){
    await token.document.update(tok.data_to_update);
}
function experience_points_get(cr){
    let xp = Array(0,200,450,700,1100,1800,2300,2900,3900,5000,5900,7200,8400,10000,11500,13000,15000,18000,20000,22000,25000);
    return xp[cr];
}
async function weapon_add(tad, template_weapon_array){
    let new_name = "";
    let weapon = "";
    let weapon_plus = await item_plus_get(tad);
    if (weapon_plus > 0){
        new_name = " +" + weapon_plus;                        
    }                            
    //let n = template_weapon_array.length;
    //let r = roll_simple(n)-1;
    weapon = template_weapon_array.random();
    new_name = weapon + new_name;
    //console.log("Trying to add weapon: " + new_name);
    tad.items_to_add_compendium.push(["dnd5e.items", new_name])
    tad.bio_narrative.push("Was given a weapon: " + new_name + ". ");
}
//================================== Dialogs ==================================
function dialog_start(){
    console.log("dialog_start");
    
    //Read in templates
    //let t_html = '<option value="world.mj-template-generic" selected>Generic</option>';
    let t_html = `<option value="mj-template-generic" selected>MJ Template - Generic</option>`
    for (let pack of game.packs){
        let label = pack.metadata.label;
        let val = pack.metadata.package + "." + pack.metadata.name;
        if (label.indexOf("MJ Template")>-1 && label != "MJ Template - Generic"){
            t_html += `<option value="` + val + `">` + label + `</option>`
        }
    }
    
    
    let d = new Dialog({
        title: "NPC Upgrade Options",
        content: `
            <form>
                <div class="form-group">
                    <label>Adjust NPC CR:</label>
                    <select id="scale-npc-cr" name="scale-npc-cr">
                        <option value="-10">-10</option>
                        <option value="-9">-9 </option>
                        <option value="-8">-8</option>
                        <option value="-7">-7</option>
                        <option value="-6">-6</option>
                        <option value="-5">-5</option>
                        <option value="-4">-4</option>
                        <option value="-3">-3</option>
                        <option value="-2">-2</option>
                        <option value="-1">-1</option>
                        <option value="0" selected>0</option>
                        <option value="1">+1</option>
                        <option value="2">+2</option>
                        <option value="3">+3</option>
                        <option value="4">+4</option>
                        <option value="5">+5</option>
                        <option value="6">+6</option>
                        <option value="7">+7</option>
                        <option value="8">+8</option>
                        <option value="9">+9</option>
                        <option value="10">+10</option>
                    </select>
                </div>
                <hr>

                <!-- re-insert template chooser here-->

                <center><div>NPC Adjustments</div></center>
                <div class="form-group">    <label>Abilities:</label>     <input id='adjust_abilities' type='checkbox' checked /></div>
                <!--<div class="form-group">    <label>Age:</label>       <input id='adjust_age' type='checkbox' checked /></div>-->
                <div class="form-group">    <label>Armor:</label>         <input id='adjust_armor' type='checkbox' checked /></div>
                <div class="form-group">    <label>HP:</label>            <input id='adjust_hp' type='checkbox' checked /></div>
                <div class="form-group">    <label>Loot:</label>          <input id='adjust_loot' type='checkbox' checked /></div>
                <div class="form-group">    <label>Movement:</label>      <input id='adjust_movement' type='checkbox' checked /></div>
                <!--<div class="form-group">    <label>Size:</label>      <input id='adjust_size' type='checkbox' checked /></div>-->
                <div class="form-group">    <label>Spells:</label>        <input id='adjust_spells' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label>       <input id='adjust_weapons' type='checkbox' checked /></div>
                <hr>
                <center><div>Clear Current</div></center>
                <div class="form-group">    <label>Armor:</label>   <input id='armor_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Features:</label><input id='feature_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Spells:</label>  <input id='spells_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label> <input id='weapons_clear' type='checkbox' checked /></div>
            </form>
        `,
      buttons: {
        upgrade: {
          icon: "<i class='fas fa-check'></i>",
          label: "Full Upgrade",
          callback: () => {
              //Get all options from Form
              let opt = [];
              let e = document.getElementById("scale-npc-cr");
              opt.cr_change = parseInt(e.options[e.selectedIndex].value);
              
              //console.log("opt.cr_change: " + opt.cr_change);
              
              //e = document.getElementById("npc_template");
              //opt.template = e.options[e.selectedIndex].value;
              opt.template = "generic";

              opt.adjust_abilities = document.getElementById("adjust_abilities").checked
              //opt.adjust_ac        = document.getElementById("adjust_ac").checked
              opt.adjust_armor     = document.getElementById("adjust_armor").checked
              opt.adjust_hp        = document.getElementById("adjust_hp").checked
              opt.adjust_loot      = document.getElementById("adjust_loot").checked
              opt.adjust_movement  = document.getElementById("adjust_movement").checked
              opt.adjust_spells    = document.getElementById("adjust_spells").checked
              opt.adjust_weapons   = document.getElementById("adjust_weapons").checked

              opt.clear_armor      = document.getElementById("armor_clear").checked
              opt.clear_features   = document.getElementById("armor_clear").checked
              opt.clear_spells     = document.getElementById("spells_clear").checked
              opt.clear_weapons    = document.getElementById("weapons_clear").checked

              main(opt);
              d.render(true);
          }
        },
        loot: {
            icon: "<i class='fas fa-check'></i>",
            label: "Loot Only",
            callback: () => {
                let opt = [];
                opt.cr_change = 0;
                opt.adjust_armor = false;
                opt.adjust_hp = false;
                opt.adjust_loot = true;
                opt.adjust_movement = false;
                opt.adjust_spells = false
                opt.adjust_weapons = false;
                opt.clear_armor = false;
                opt.clear_features = false;
                opt.clear_spells = false;
                opt.clear_weapons = false;
                main(opt);
                d.render(true);
            }
        }
      }
    }).render(true);
}
function log(group, logStr){
    console.group(group);
    console.log(logStr);
    console.groupEnd();
}
function l(logStr){
    console.log(logStr);
}
// Javascript Extensions:
Array.prototype.random = function () { 
    return this[Math.floor((Math.random()*this.length))];
}
Array.prototype.shuffle = function() {
    var i = this.length, j, temp;
    if ( i == 0 ) return this;
    while ( --i ) {
       j = Math.floor( Math.random() * ( i + 1 ) );
       temp = this[i];
       this[i] = this[j];
       this[j] = temp;
    }
    return this;
  }
String.prototype.capitalize = function () { return this.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase()))); }
