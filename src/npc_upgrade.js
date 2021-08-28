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


        GP/CR for Armor/Magic Items/Shield/Weapons [Dropdown] 

        Use Luck [ ]
        Use Social Status [ ]


    * Hover information for options

    //Add tad.log[] as an array of changes made to token.

*/
console.clear();

//Constants for tweaking scale settings
const ABILITY_LEVEL_PER_PLUS = 3;
const GEM_BASE_PERCENT = 50;
const LEVEL_PER_PLUS_ARMOR_SHIELD_WEAPON = 16;
const NPC_HIT_DIE = 12;
const TAB = "&nbsp;&nbsp;&nbsp;&nbsp;";

if (canvas.tokens.controlled.length == 0){ alert("Please select at least one NPC!"); return;}

dialog_start();
async function main(opt){
    opt.npc_count = await npc_count_get();
    opt.party_level_average = await party_level_average_get()

    opt.tweak_factor = 1;

    //Load in some data
    let crdb = crdb_get();

    for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
        if (token.actor.type != "npc"){ continue; } //Skip it if it's not an npc

        let AD   = "actorData.data.";                       //Used for WRITING data to token. Foundry Data
        let TADD = token.actor.data.data;                   //Used for READING data from token. Foundry Data

        //Setup tad (Token Actor Data) object
        let tad = new Token_Actor_Data(token, opt);
        

        //Get/set original data
        let original_actorData = TADD.original_actorData;
        if (!original_actorData){
            original_actorData = await token.actor.data;
            tad.actorData_updates["actorData.data.original_actorData"] = original_actorData;
        }
        tad.log("After set original data");

        //Scale basic token info
        tad.cr = TADD.details.cr;
        tad.cr_orig = original_actorData.data.details.cr;
        if (tad.cr < 1){ tad.cr = 1; }
        tad.cr_new = tad.cr + tad.opt.cr_change;
        tad.new_cr_str = tad.cr_new.toString();
        if (tad.cr_new < 1){ tad.cr_new = 1; }
        tad.actorData_updates[AD+"details.cr"] = tad.cr_new;
        tad.cr_change_since_orig = Math.round(tad.cr_new - tad.cr_orig);

        //Misc Token info
        tad.alignment = TADD.details.alignment;
        tad.gender = gender_get();
        tad.name = token.actor.data.token.name;
        tad.race = TADD.details.race;
        tad.creature_type = TADD.details.type.value;
        //tad.is_humanoid = is_humanoid(tad);     tad.bio_traits.push(["Humanoid", tad.is_humanoid]);
        tad.max_spell_level = spell_level_get_max(tad.cr_new);
        tad.spellcaster_type = TADD.attributes.spellcasting;
        tad.bio_updates.push(["CR", original_actorData.data.details.cr, tad.cr_new]);
        tad.bio_traits.push(["Gender", tad.gender]);

        //Social Status, Luck
        if (opt.use_luck){
            tad.luck = roll_bell_curve_1000();
        } else {
            tad.luck = 1;
        }
        if (opt.use_social_status){
            tad.social_status = roll_bell_curve_1000(TADD.abilities.cha.mod * 2);
        } else {
            tad.social_status = 1;
        }
        tad.xp = experience_points_get(tad.cr_new);
        tad.adjusted_cr = Math.round(tad.cr_new * tad.social_status * tad.luck);    //Rounds up if >= 0.5
        tad.bio_traits.push(["Luck factor", tad.luck]);
        tad.bio_traits.push(["Social Status factor", tad.social_status]);
        tad.starting_gold = (Math.round((tad.xp/2) * opt.gpcr_factor * tad.social_status * tad.luck)) + roll_simple(tad.adjusted_cr);
        l(tad);

        //Read in template
        tad.template = await template_choose(tad);

        //Abilities Adjust
        tad.con = original_actorData.data.abilities.con.value;
        for (let ability of tad.template.abilities){
            let orig_ability = original_actorData.data.abilities[ability].value;
            let new_value = orig_ability + Math.round(tad.cr_change_since_orig/ABILITY_LEVEL_PER_PLUS);
            tad.actorData_updates[AD+"abilities." + ability + ".value"] = new_value;
            tad.bio_updates.push([ability.capitalize(), orig_ability, new_value]);
            tad.attributes[ability] = new_value;
            //if (ability == "con"){ tad.con = new_value; }
        }

        //HP Adjust
        //tad.hp_max = roll_simple(crdb[tad.new_cr_str].hphi - crdb[tad.new_cr_str].hplo) + crdb[tad.new_cr_str].hplo;
        tad.hp_max = roll_lo_hi(crdb[tad.new_cr_str].hplo, crdb[tad.new_cr_str].hphi);
        tad.actorData_updates[AD+"attributes.hp.max"] = tad.hp_max;

        //Humanoid vs Non-Humanoid updates
        if (tad.is_humanoid){
            //Armor Class - Humanoid
            tad.actorData_updates[AD+"attributes.ac.flat"] = null;
            tad.actorData_updates[AD+"attributes.ac.calc"] = "default";

            //Flag some item types to be deleted from inventory
            tad.item_types_to_delete.push("equipment");
            tad.item_types_to_delete.push("spell");
            tad.item_types_to_delete.push("weapon");

            //Flag some individual items to be deleted
            for (let item of token.actor.items){
                if (item.name.indexOf("Multiattack")>-1){
                    tad.items_to_delete.push(item._id);
                }
            }

            //Does multi-Attack need added?
            if (tad.template.has_multiattack){
                if (tad.cr_new > 2){
                    if (tad.cr_new > 11){
                        feat_add_queue(tad, "Multiattack (3 Attacks)", "The NPC gets 3 melee attacks.", "systems/dnd5e/icons/skills/green_03.jpg");
                    } else {
                        feat_add_queue(tad, "Multiattack (2 Attacks)", "The NPC gets 2 melee attacks.", "systems/dnd5e/icons/skills/green_03.jpg");
                    }
                }
            }

            npc_equip(tad); 
        } else {
            //Armor Class - Non-Humanoid
            tad.actorData_updates[AD+"attributes.ac.calc"] = "natural";
            tad.actorData_updates[AD+"attributes.ac.flat"] = crdb[tad.new_cr_str].ac;
            //tad.actorData_updates[AD+"attributes.ac.base"] = crdb[tad.new_cr_str].ac;

            //Movement Adjust: Adjust up or down by 1 foot per CR 
            for (let m of ["burrow","climb","fly","swim","walk"]){
                console.log(original_actorData);
                let cur_m = original_actorData.data.attributes.movement[m];
                if (cur_m > 0){
                    tad.movement[m] = Math.round(cur_m + tad.cr_new);
                    tad.actorData_updates[AD+"attributes.movement." + m] = tad.movement[m];
                    tad.bio_updates.push([m.capitalize(), cur_m + "'", tad.movement[m] + "'"])
                }
            }

            //Items Adjust
            for (let item of token.actor.items){
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
                        let newD = d + Math.round(tad.cr_change_since_orig); //Removed /2 to increase damage
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
        }

        //Add spells for spellcasters
        if (tad.spellcaster_type){
            for (let level = 1; level <= tad.max_spell_level; level++){
                for (let spell of tad.template.spell_list[level]){
                    tad.items_to_add_compendium.push(["dnd5e.spells", spell]);
                }
            }
            tad.actorData_updates[AD+"details.spellLevel"] = tad.cr_new;
        }

        //Update biography
        tad.bio = original_actorData.data.details.biography.value + "<br><hr>";
            console.log("Before Biography Update");
        
        await biography_update(tad);
        tad.actorData_updates[AD+"details.biography.value"] = tad.bio;

            console.log("After Biography Update");
            console.log("Before Token.document.update");

        await token.document.update(tad.actorData_updates);
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
function feat_add_queue(tad, name, description, img){
    tad.items_to_add_raw.push({
        name: name,
        type: "feat",
        data: {
            description: {
                value: description
            }
        },
        img:img
    });
}
function gender_get(){
    return ["Male","Female"].random();
}

/*
function is_humanoid(tad){
    if (["celestial","fey","giant","humanoid"].includes(tad.creature_type.toLowerCase()) || ["centaur","drider","ghast","ghoul","lich","medusa","merrow","minotaur","minotaur skeleton","mummy lord","ogre zombie","skeleton","vampire","vampire spawn","wight","zombie"].includes(tad.name.toLowerCase())){
        return true;
    } else {
        return false;
    }
}
*/

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
        loot_add_queue(tad, "Gems (" + gem_value + " gp value)", gem_qty, parseInt(gem_value/gem_qty), "icons/commodities/gems/gem-faceted-cushion-teal-black.webp");
    }
    if (gp_value > 0){
        loot_add_queue(tad, "Gold Pieces (" + gp_value + ")", gp_value, 1, "icons/commodities/currency/coins-plain-stack-gold.webp");
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

    /*Figure out what items a NPC has based on their starting_gold */
    switch(tad.template.class){
        case "Fighter":
            npc_equip_base_weapons_get(tad);
            npc_equip_weapons_add_magic(tad.starting_gold, tad.weapon_1);
            npc_equip_weapons_add_magic(tad.starting_gold, tad.weapon_2);
            npc_equip_armor(tad);
            npc_equip_shield(tad);
            break;
        case "Cleric":
            npc_equip_base_weapons_get(tad);
            npc_equip_weapons_add_magic(tad);
            npc_equip_armor(tad);
            npc_equip_shield(tad);
            break;
        case "Wizard":
            npc_equip_base_weapons_get(tad);
            npc_equip_misc_magic(tad);
            npc_equip_weapons_add_magic(tad);
    }

    //Equip NPC Weapons
    if (tad.creature_type === "giant"){
        weapon_special_scale_giant_str(tad.weapon_1, tad.attributes["str"]);    //Scale weapons based on giant str
        weapon_special_scale_giant_str(tad.weapon_2, tad.attributes["str"]);
        weapon_special_add_queue(tad, tad.weapon_1);                            //Add weapons to queue
        weapon_special_add_queue(tad, tad.weapon_2);
    } else {
        tad.items_to_add_compendium.push(["dnd5e.items", tad.weapon_1]);        //Add standard weapons from SRD Items
        tad.items_to_add_compendium.push(["dnd5e.items", tad.weapon_2]);
    }

    //Loot
    tad.starting_gold = parseInt(tad.starting_gold/10);
    loot_generate(tad);
}
//function weapon_queue_items_to_add_raw(weapons, weapon){
function weapon_special_scale_giant_str(weapon, str){
    if (str > 0){  weapon.add_dam_die = 0; weapon.scale = "xs"; } //Add 1 damage die to normal weapon damage
    if (str > 10){ weapon.add_dam_die = 1; weapon.scale = "sm"; }
    if (str > 15){ weapon.add_dam_die = 2; weapon.scale = "m"; }
    if (str > 20){ weapon.add_dam_die = 3; weapon.scale = "lg"; }
    if (str > 22){ weapon.add_dam_die = 4; weapon.scale = "xl"; }
    if (str > 25){ weapon.add_dam_die = 5; weapon.scale = "xxl"; }

    weapon.dam = weapon.db.dam;
    weapon.die_count = parseInt(weapon.dam.substring(0,1)) + weapon.add_dam_die;

    console.log(weapon);

    weapon.new_dam = weapon.die_count.toString() + weapon.dam.substring(1,100);
    weapon.name += " (" + weapon.scale + ")";
}
function weapon_special_add_queue(tad, weapon){
    let parts = [];
    parts[0] = [];
    parts[0][0] = weapon.new_dam;
    parts[0][1] = weapon.db.dam_type;
    tad.items_to_add_raw.push({
        name: weapon.name,
        type: "weapon",
        data: {
            actionType: weapon.db.ak,
            quantity: 1,
            price: weapon.db.value,
            damage: {
                parts: parts
            }
        },
        img: weapon.db.img,
        weaponType: weapon.db.weaponType
    });
}
function npc_equip_armor(tad){
    //We are giving PCs base level armor for free
    let armor = [];
    armor["None"]   = [];
    armor["Light"]  = ["Padded Armor","Leather Armor","Studded Leather Armor"];
    armor["Medium"] = ["Padded Armor","Leather Armor","Studded Leather Armor","Hide Armor","Chain Shirt","Scale Mail","Breastplate","Half Plate Armor"];
    armor["Heavy"]  = ["Padded Armor","Leather Armor","Studded Leather Armor","Hide Armor","Chain Shirt","Scale Mail","Breastplate","Half Plate Armor","Ring Mail","Chain Mail","Splint Armor","Plate Armor"];

    let armor_count = armor[tad.template.armor].length;
    let roll = roll_simple(armor_count);
    roll = roll - 4 + tad.cr_new;
    if (roll < 0){ roll = 1; }
    if (roll > armor_count){ roll = armor_count; }

    console.log("armor_count", armor_count);    
    console.log("roll", roll);


    tad.armor = armor[tad.template.armor][roll-1];
    //tad.armor = armor[tad.template.armor].random();
    console.log("armor result", tad)

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
}
function npc_equip_base_weapons_get(tad){
    //Get melee weapons
    if (roll_simple(2) == 1){
        tad.weapon_1.base = tad.template.weapons_1_handed.random();
    } else {
        tad.weapon_1.base = tad.template.weapons_2_handed.random();
    }

    //Get ranged weapons
    if (roll_simple(2) == 1){
        tad.weapon_2.base = tad.template.weapons_1_handed_range.random();
    } else {
        tad.weapon_2.base = tad.template.weapons_2_handed_range.random();
    }
    tad.weapon_1.db = weapondb_get(tad.weapon_1.base);                          //Lookup base weapon info
    tad.weapon_2.db = weapondb_get(tad.weapon_2.base);

    console.log("npc_equip_base_weapons_get()", tad);
}

function npc_equip_shield(tad){
    if (!tad.weapon_1.db.h){
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

function npc_equip_weapons_add_magic(starting_gold, weapon){
    //Buy Weapon with starting gold
    if (starting_gold > 16000){
        starting_gold -= 16000;
        weapon.name = weapon.base + " +3";
        weapon.plus = 3;
    } else if (starting_gold > 4000){
        starting_gold -= 4000;
        weapon.name = weapon.base + " +2";
        weapon.plus = 2;
    } else if (starting_gold > 1000){
        starting_gold -= 1000;
        weapon.name = weapon.base + " +1";
        weapon.plus = 1;
    } else {
        weapon.name = weapon.base;
        weapon.plus = 0;
        console.log("No gold for weapon", weapon)
    }

    console.log("npc_equip_weapons_add_magic()", weapon);
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
function roll_lo_hi(lo, hi){
    return roll_simple(hi - lo + 1) + lo - 1;
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

    //Figure out if token is humanoid
    if (["celestial","fey","giant","humanoid"].includes(tad.creature_type.toLowerCase()) || ["centaur","drider","ghast","ghoul","lich","medusa","merrow","minotaur","minotaur skeleton","mummy lord","ogre zombie","skeleton","vampire","vampire spawn","wight","zombie"].includes(tad.name.toLowerCase())){
        tad.is_humanoid = true;
    } else {
        tad.is_humanoid = false;
    }

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
        if (tad.creature_type == "Beast"){
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
            template.abilities = ["dex","con","str"];
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
                <div class="form-group">
                    <label>GP/CR Factor:</label>
                    <select id="gpcr_factor" name="gpcr_factor">
                        <option value="0">-100% (No GP!)</option>
                        <option value=".25">25%</option>
                        <option value=".50">50%</option>
                        <option value=".75">75%</option>
                        <option value="1" selected>100% : GP = (XP/2)</option>
                        <option value="1.25">125%</option>
                        <option value="1.50">150%</option>
                        <option value="1.75">175%</option>
                        <option value="2">200%</option>
                        <option value="3">300%</option>
                    </select>
                </div>
                <hr>
                <div class="form-group">    <div id='label_luck' style='cursor:pointer;'>Use Luck:</div>          <input id='use_luck' type='checkbox' checked /></div>
                <div class="form-group">    <div id='label_social_status'>Use Social Status:</div> <input id='use_social_status' type='checkbox' checked /></div>

                <!-- re-insert template chooser here

                <center><div>NPC Adjustments</div></center>
                <div class="form-group">    <label>Abilities:</label>     <input id='adjust_abilities' type='checkbox' checked /></div>
                
                <div class="form-group">    <label>Armor:</label>         <input id='adjust_armor' type='checkbox' checked /></div>
                <div class="form-group">    <label>HP:</label>            <input id='adjust_hp' type='checkbox' checked /></div>
                <div class="form-group">    <label>Loot:</label>          <input id='adjust_loot' type='checkbox' checked /></div>
                <div class="form-group">    <label>Movement:</label>      <input id='adjust_movement' type='checkbox' checked /></div>
                
                <div class="form-group">    <label>Spells:</label>        <input id='adjust_spells' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label>       <input id='adjust_weapons' type='checkbox' checked /></div>
                <hr>
                <center><div>Clear Current</div></center>
                <div class="form-group">    <label>Armor:</label>   <input id='armor_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Features:</label><input id='feature_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Spells:</label>  <input id='spells_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label> <input id='weapons_clear' type='checkbox' checked /></div>
                -->
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
                e = document.getElementById("gpcr_factor");
                opt.gpcr_factor = parseFloat(e.options[e.selectedIndex].value);
                //e = document.getElementById("npc_template");
                //opt.template = e.options[e.selectedIndex].value;
                opt.use_luck          = document.getElementById("use_luck").checked
                opt.use_social_status = document.getElementById("use_social_status").checked
                opt.template = "generic";

                //opt.adjust_abilities = document.getElementById("adjust_abilities").checked
                //opt.adjust_ac        = document.getElementById("adjust_ac").checked
                //opt.adjust_armor     = document.getElementById("adjust_armor").checked
                //opt.adjust_hp        = document.getElementById("adjust_hp").checked
                //opt.adjust_loot      = document.getElementById("adjust_loot").checked
                //opt.adjust_movement  = document.getElementById("adjust_movement").checked
                //opt.adjust_spells    = document.getElementById("adjust_spells").checked
                //opt.adjust_weapons   = document.getElementById("adjust_weapons").checked

                //opt.clear_armor      = document.getElementById("armor_clear").checked
                //opt.clear_features   = document.getElementById("armor_clear").checked
                //opt.clear_spells     = document.getElementById("spells_clear").checked
                //opt.clear_weapons    = document.getElementById("weapons_clear").checked

                main(opt);
                d.render(true);
                $("#label_luck").attr('title', 'This is Luck tooltip');
                $("#label_social_status").attr('title', 'This is Social Status tooltip');
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
        },
        render: () => {
            console.log("After Render!!!");
            $("#label_luck").attr('title', 'Luck \n\n\n\n\n\n\n Tooltip');
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

function ardb_get(isGiant){

}


function crdb_get(){
    let arr = [];
    arr["0"] = {xp:10,prof:2,ac:13,hplo:0,hphi:6,att:3,damlo:0,damhi:1,sav:13};
    arr["1/8"] = {xp:25,prof:2,ac:13,hplo:7,hphi:35,att:3,damlo:2,damhi:3,sav:13};
    arr["1/4"] = {xp:50,prof:2,ac:13,hplo:36,hphi:49,att:3,damlo:4,damhi:5,sav:13};
    arr["1/2"] = {xp:100,prof:2,ac:13,hplo:50,hphi:70,att:3,damlo:6,damhi:8,sav:13};
    arr["1"] = {xp:200,prof:2,ac:13,hplo:71,hphi:85,att:3,damlo:9,damhi:14,sav:13};
    arr["2"] = {xp:450,prof:2,ac:13,hplo:86,hphi:100,att:3,damlo:15,damhi:20,sav:13};
    arr["3"] = {xp:700,prof:2,ac:13,hplo:101,hphi:115,att:4,damlo:21,damhi:26,sav:13};
    arr["4"] = {xp:1100,prof:2,ac:14,hplo:116,hphi:130,att:5,damlo:27,damhi:32,sav:14};
    arr["5"] = {xp:1800,prof:3,ac:15,hplo:131,hphi:145,att:6,damlo:33,damhi:38,sav:15};
    arr["6"] = {xp:2300,prof:3,ac:15,hplo:146,hphi:160,att:6,damlo:39,damhi:44,sav:15};
    arr["7"] = {xp:2900,prof:3,ac:15,hplo:161,hphi:175,att:6,damlo:45,damhi:50,sav:15};
    arr["8"] = {xp:3900,prof:3,ac:16,hplo:176,hphi:190,att:7,damlo:51,damhi:56,sav:16};
    arr["9"] = {xp:5000,prof:4,ac:16,hplo:191,hphi:205,att:7,damlo:57,damhi:62,sav:16};
    arr["10"] = {xp:5900,prof:4,ac:17,hplo:206,hphi:220,att:7,damlo:63,damhi:68,sav:16};
    arr["11"] = {xp:7200,prof:4,ac:17,hplo:221,hphi:235,att:8,damlo:69,damhi:74,sav:17};
    arr["12"] = {xp:8400,prof:4,ac:17,hplo:236,hphi:250,att:8,damlo:75,damhi:80,sav:18};
    arr["13"] = {xp:10000,prof:5,ac:18,hplo:251,hphi:265,att:8,damlo:81,damhi:86,sav:18};
    arr["14"] = {xp:11500,prof:5,ac:18,hplo:266,hphi:280,att:8,damlo:87,damhi:92,sav:18};
    arr["15"] = {xp:13000,prof:5,ac:18,hplo:281,hphi:295,att:8,damlo:93,damhi:98,sav:18};
    arr["16"] = {xp:15000,prof:5,ac:18,hplo:296,hphi:310,att:9,damlo:99,damhi:104,sav:18};
    arr["17"] = {xp:18000,prof:6,ac:19,hplo:311,hphi:325,att:10,damlo:105,damhi:110,sav:19};
    arr["18"] = {xp:20000,prof:6,ac:19,hplo:326,hphi:340,att:10,damlo:111,damhi:116,sav:19};
    arr["19"] = {xp:22000,prof:6,ac:19,hplo:341,hphi:355,att:10,damlo:117,damhi:122,sav:19};
    arr["20"] = {xp:25000,prof:6,ac:19,hplo:356,hphi:400,att:10,damlo:123,damhi:140,sav:19};
    arr["21"] = {xp:33000,prof:7,ac:19,hplo:401,hphi:445,att:11,damlo:141,damhi:158,sav:20};
    arr["22"] = {xp:41000,prof:7,ac:19,hplo:446,hphi:490,att:11,damlo:159,damhi:176,sav:20};
    arr["23"] = {xp:50000,prof:7,ac:19,hplo:491,hphi:535,att:11,damlo:177,damhi:194,sav:20};
    arr["24"] = {xp:62000,prof:7,ac:19,hplo:536,hphi:580,att:11,damlo:195,damhi:212,sav:21};
    arr["25"] = {xp:75000,prof:8,ac:19,hplo:581,hphi:625,att:12,damlo:213,damhi:230,sav:21};
    arr["26"] = {xp:90000,prof:8,ac:19,hplo:626,hphi:670,att:12,damlo:231,damhi:248,sav:21};
    arr["27"] = {xp:105000,prof:8,ac:19,hplo:671,hphi:715,att:13,damlo:249,damhi:266,sav:22};
    arr["28"] = {xp:120000,prof:8,ac:19,hplo:716,hphi:760,att:13,damlo:267,damhi:284,sav:22};
    arr["29"] = {xp:135000,prof:9,ac:19,hplo:760,hphi:805,att:13,damlo:285,damhi:302,sav:22};
    arr["30"] = {xp:155000,prof:9,ac:19,hplo:805,hphi:850,att:14,damlo:303,damhi:320,sav:23};
    return arr;
}
function weapondb_get(base){
    //Weapon Database - For creating weapons on-the-fly
    let icons = "systems/dnd5e/icons/items/weapons/";
    let weapon = [];
    weapon["Battleaxe"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d8 + @mod",dam_type:"slashing",heavy:false,price:10,range:5,range_long:null,reach:false,type:"martialM",weight:4};
    weapon["Blowgun"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:false,dam:"1 + @mod",dam_type:"piercing",heavy:false,price:10,range:25,range_long:100,reach:false,type:"martialR",weight:1};
    weapon["Club"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d4 + @mod",dam_type:"bludgeoning",heavy:false,price:0.1,range:5,range_long:null,reach:false,type:"simpleM",weight:2};
    weapon["Dagger"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d4 + @mod",dam_type:"piercing",heavy:false,price:2,range:20,range_long:60,reach:false,type:"simpleM",weight:1};
    weapon["Dart"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:false,dam:"1d4 + @mod",dam_type:"piercing",heavy:false,price:0.05,range:20,range_long:60,reach:false,type:"simpleR",weight:0.25};
    weapon["Flail"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d8+@mod",dam_type:"bludgeoning",heavy:false,price:10,range:5,range_long:0,reach:false,type:"martialM",weight:2};
    weapon["Glaive"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"1d10 + @mod",dam_type:"slashing",heavy:true,price:20,range:10,range_long:null,reach:true,type:"martialM",weight:6};
    weapon["Greataxe"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"1d12 + @mod",dam_type:"slashing",heavy:true,price:30,range:5,range_long:null,reach:false,type:"martialM",weight:7};
    weapon["Greatclub"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"1d8 + @mod",dam_type:"bludgeoning",heavy:false,price:0.2,range:5,range_long:0,reach:false,type:"simpleM",weight:10};
    weapon["Greatsword"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"2d6 + @mod",dam_type:"slashing",heavy:true,price:50,range:5,range_long:null,reach:false,type:"martialM",weight:6};
    weapon["Halberd"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"1d10 + @mod",dam_type:"slashing",heavy:true,price:20,range:10,range_long:null,reach:true,type:"martialM",weight:6};
    weapon["Hand Crossbow"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:false,dam:"1d6 + @mod",dam_type:"piercing",heavy:false,price:75,range:30,range_long:120,reach:false,type:"martialR",weight:3};
    weapon["Handaxe"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d6 + @mod",dam_type:"slashing",heavy:false,price:5,range:20,range_long:60,reach:false,type:"simpleM",weight:2};
    weapon["Heavy Crossbow"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:true,dam:"1d10 + @mod",dam_type:"piercing",heavy:true,price:50,range:100,range_long:400,reach:false,type:"martialR",weight:18};
    weapon["Javelin"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:false,dam:"1d6 + @mod",dam_type:"piercing",heavy:false,price:0.5,range:30,range_long:120,reach:false,type:"simpleM",weight:2};
    weapon["Lance"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d12 + @mod",dam_type:"piercing",heavy:false,price:10,range:10,range_long:null,reach:true,type:"martialM",weight:6};
    weapon["Light Crossbow"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:true,dam:"1d8 + @mod",dam_type:"piercing",heavy:false,price:25,range:80,range_long:320,reach:false,type:"simpleR",weight:5};
    weapon["Light Hammer"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d4 + @mod",dam_type:"bludgeoning",heavy:false,price:2,range:20,range_long:60,reach:false,type:"simpleM",weight:2};
    weapon["Longbow"]={img: icons + "bow-long.jpg",ak:"rwak",h:true,dam:"1d8 + @mod",dam_type:"piercing",heavy:true,price:50,range:150,range_long:600,reach:false,type:"martialR",weight:2};
    weapon["Longsword"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:undefined,dam:"1d8 + @mod",dam_type:"slashing",heavy:undefined,price:15,range:5,range_long:null,reach:undefined,type:"martialM",weight:3};
    weapon["Mace"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d6 + @mod",dam_type:"bludgeoning",heavy:false,price:5,range:5,range_long:0,reach:false,type:"simpleM",weight:4};
    weapon["Maul"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"2d6 + @mod",dam_type:"bludgeoning",heavy:true,price:10,range:5,range_long:null,reach:undefined,type:"martialM",weight:10};
    weapon["Morningstar"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d8+@mod",dam_type:"piercing",heavy:false,price:15,range:5,range_long:0,reach:false,type:"martialM",weight:4};
    weapon["Pike"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:true,dam:"1d10 + @mod",dam_type:"piercing",heavy:true,price:5,range:10,range_long:null,reach:true,type:"martialM",weight:18};
    weapon["Quarterstaff"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d6 + @mod",dam_type:"bludgeoning",heavy:false,price:0.2,range:5,range_long:null,reach:false,type:"simpleM",weight:4};
    weapon["Rapier"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:undefined,dam:"1d8 + @mod",dam_type:"piercing",heavy:undefined,price:25,range:5,range_long:null,reach:undefined,type:"martialM",weight:2};
    weapon["Scimitar"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:undefined,dam:"1d6 + @mod",dam_type:"slashing",heavy:undefined,price:25,range:5,range_long:null,reach:undefined,type:"martialM",weight:3};
    weapon["Shortbow"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:true,dam:"1d6 + @mod",dam_type:"piercing",heavy:false,price:25,range:80,range_long:320,reach:false,type:"simpleR",weight:2};
    weapon["Sickle"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d4 + @mod",dam_type:"slashing",heavy:false,price:1,range:5,range_long:null,reach:false,type:"simpleM",weight:2};
    weapon["Sling"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:false,dam:"1d4 + @mod",dam_type:"bludgeoning",heavy:false,price:0.1,range:30,range_long:120,reach:false,type:"simpleR",weight:0};
    weapon["Spear"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d6 + @mod",dam_type:"piercing",heavy:false,price:1,range:20,range_long:60,reach:false,type:"simpleM",weight:3};
    weapon["Trident"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d6 + @mod",dam_type:"piercing",heavy:false,price:5,range:20,range_long:60,reach:false,type:"martialM",weight:4};
    weapon["War Pick"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d8 + @mod",dam_type:"piercing",heavy:false,price:5,range:5,range_long:null,reach:false,type:"martialM",weight:2};
    weapon["Warhammer"]={img: icons + "crossbow-heavy.jpg",ak:"mwak",h:false,dam:"1d8 + @mod",dam_type:"bludgeoning",heavy:false,price:15,range:5,range_long:null,reach:false,type:"martialM",weight:2};
    weapon["Whip"]={img: icons + "crossbow-heavy.jpg",ak:"rwak",h:false,dam:"1d4 + @mod",dam_type:"slashing",heavy:false,price:2,range:10,range_long:null,reach:true,type:"martialM",weight:3};
    return weapon[base];
}


class Token_Actor_Data {
    actorData_updates = [];
    attributes = [];
    bio_narrative = [];
    bio_traits = [];
    bio_updates = [];
    item_types_to_delete = [];
    items_to_add_compendium = [];
    items_to_add_raw = [];
    items_to_delete = [];
    events = [];
    movement = [];
    weapons = [];
    weapon_1 = [];
    weapon_2 = [];

    constructor(token, opt){
        this.opt = opt;
        //let AD   = "actorData.data.";                       //Used for WRITING data to token. Foundry Data
        //let TADD = token.actor.data.data;                   //Used for READING data from token. Foundry Data


    }
    log(logStr){
        this.events.push(logStr);
    }
}

