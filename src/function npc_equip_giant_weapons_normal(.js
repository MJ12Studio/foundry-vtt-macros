function npc_equip_giant_weapons_normal(tad){
    //Choose weapon types
    tad.weapon_1_base = ["Giant Axe","Giant Club","Giant Morningstar","Giant Sword"].random();
    tad.weapon_2_base = ["Giant Crossbow","Giant Longbow"].random();

    //Choose Weapon Scale
    let str = tad.attributes["str"];
    switch(true){
        case str < 11:
            tad.weapon_1_scale = "xs"
            tad.weapon_2_scale = "xs"
            break;
        case str < 16:
            tad.weapon_1_scale = "sm"
            tad.weapon_2_scale = "sm"
            break;
        case str < 21:
            tad.weapon_1_scale = "m"
            tad.weapon_2_scale = "m"
            break;
        case str < 23:
            tad.weapon_1_scale = "lg"
            tad.weapon_2_scale = "lg"
            break;
        case str < 31:
            tad.weapon_1_scale = "xl"
            tad.weapon_2_scale = "xl"
            break;
    }

    tad.weapon_1 = tad.weapon_1_base + " (" + tad.weapon_1_scale + ") ";
    tad.weapon_2 = tad.weapon_2_base + " (" + tad.weapon_2_scale + ") ";


    npc_equip_weapons_magic(tad);

    //Build the weapons
    let weapon = [];
    let icons = "systems/dnd5e/icons/items/weapons/";
    weapon["Giant Axe (xs)"] = {type:"giant", min_str:1, dam: "1d12 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greataxe.jpg"};
    weapon["Giant Axe (sm)"] = {type:"giant", min_str:19, dam: "2d12 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greataxe.jpg"};
    weapon["Giant Axe (m)"] =  {type:"giant", min_str:21, dam: "3d12 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greataxe.jpg"};
    weapon["Giant Axe (lg)"] = {type:"giant", min_str:23, dam: "4d12 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greataxe.jpg"};
    weapon["Giant Axe (xl)"] = {type:"giant", min_str:25, dam: "5d12 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greataxe.jpg"};
    weapon["Giant Club (xs)"] = {type:"giant", min_str:1, dam: "2d8 +@mod", dam_type:"bludgeoning", weapon_type: "simpleM", img: icons + "greatclub.png"};
    weapon["Giant Club (sm)"] = {type:"giant", min_str:19, dam: "3d8 +@mod", dam_type:"bludgeoning", weapon_type: "simpleM", img: icons + "greatclub.png"};
    weapon["Giant Club (m)"] =  {type:"giant", min_str:21, dam: "4d8 +@mod", dam_type:"bludgeoning", weapon_type: "simpleM", img: icons + "greatclub.png"};
    weapon["Giant Club (lg)"] = {type:"giant", min_str:23, dam: "5d8 +@mod", dam_type:"bludgeoning", weapon_type: "simpleM", img: icons + "greatclub.png"};
    weapon["Giant Club (xl)"] = {type:"giant", min_str:25, dam: "6d8 +@mod", dam_type:"bludgeoning", weapon_type: "simpleM", img: icons + "greatclub.png"};
    weapon["Giant Morningstar (xs)"] = {type:"giant", min_str:1, dam: "2d8 +@mod", dam_type:"piering", weapon_type: "martialM", img: icons + "morningstar.jpg"};
    weapon["Giant Morningstar (sm)"] = {type:"giant", min_str:19, dam: "3d8 +@mod", dam_type:"piering", weapon_type: "martialM", img: icons + "morningstar.jpg"};
    weapon["Giant Morningstar (m)"] =  {type:"giant", min_str:21, dam: "4d8 +@mod", dam_type:"piering", weapon_type: "martialM", img: icons + "morningstar.jpg"};
    weapon["Giant Morningstar (lg)"] = {type:"giant", min_str:23, dam: "5d8 +@mod", dam_type:"piering", weapon_type: "martialM", img: icons + "morningstar.jpg"};
    weapon["Giant Morningstar (xl)"] = {type:"giant", min_str:25, dam: "6d8 +@mod", dam_type:"piering", weapon_type: "martialM", img: icons + "morningstar.jpg"};
    weapon["Giant Sword (xs)"] = {type:"giant", min_str:1, dam: "2d6 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greatsword.png"};
    weapon["Giant Sword (sm)"] = {type:"giant", min_str:19, dam: "3d6 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greatsword.png"};
    weapon["Giant Sword (m)"] =  {type:"giant", min_str:21, dam: "4d6 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greatsword.png"};
    weapon["Giant Sword (lg)"] = {type:"giant", min_str:23, dam: "5d6 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greatsword.png"};
    weapon["Giant Sword (xl)"] = {type:"giant", min_str:25, dam: "6d6 +@mod", dam_type:"slashing", weapon_type: "martialM", img: icons + "greatsword.png"};

    console.log(tad);
    console.log("Building Giant Weapon 1: " + tad.weapon_1);
    console.log("Building Giant Weapon 2: " + tad.weapon_2);

    let img = "";
    let key = tad.weapon_1_base + " (" + tad.weapon_1_scale + ")";
    let parts = [];
    parts[0] = [];
    parts[0][0] = weapon[key].dam;
    parts[0][1] = weapon[key].dam_type;

    tad.items_to_add_raw.push({
        name: tad.weapon_1,
        type: "weapon",
        data: {
            actionType: "mwak",
            quantity: 1,
            price: tad.weapon_1_value,
            damage: {
                parts: parts
            }

        },
        img: weapon[key].img,
        weaponType: weapon[key].weapon_type
    });

    
    

    weapon = [];
    weapon["Giant Crossbow (xs)"] = {type:"giant", min_str:1, dam: "1d10 +@mod", dam_type:"piering", img: icons + "crossbow-heavy.jpg"};
    weapon["Giant Crossbow (sm)"] = {type:"giant", min_str:19, dam: "2d10 +@mod", dam_type:"piering", img: icons + "crossbow-heavy.jpg"};
    weapon["Giant Crossbow (m)"] =  {type:"giant", min_str:21, dam: "3d10 +@mod", dam_type:"piering", img: icons + "crossbow-heavy.jpg"};
    weapon["Giant Crossbow (lg)"] = {type:"giant", min_str:23, dam: "4d10 +@mod", dam_type:"piering", img: icons + "crossbow-heavy.jpg"};
    weapon["Giant Crossbow (xl)"] = {type:"giant", min_str:25, dam: "5d10 +@mod", dam_type:"piering", img: icons + "crossbow-heavy.jpg"};
    weapon["Giant Longbow (xs)"] = {type:"giant", min_str:1, dam: "2d8 +@mod", dam_type:"piering", img: icons + "bow-long.jpg"};
    weapon["Giant Longbow (sm)"] = {type:"giant", min_str:19, dam: "3d8 +@mod", dam_type:"piering", img: icons + "bow-long.jpg"};
    weapon["Giant Longbow (m)"] =  {type:"giant", min_str:21, dam: "4d8 +@mod", dam_type:"piering", img: icons + "bow-long.jpg"};
    weapon["Giant Longbow (lg)"] = {type:"giant", min_str:23, dam: "5d8 +@mod", dam_type:"piering", img: icons + "bow-long.jpg"};
    weapon["Giant Longbow (xl)"] = {type:"giant", min_str:25, dam: "6d8 +@mod", dam_type:"piering", img: icons + "bow-long.jpg"};

    img = "";
    key = tad.weapon_2_base + " (" + tad.weapon_2_scale + ")";
    parts[0][0] = weapon[key].dam;
    parts[0][1] = weapon[key].dam_type;

    tad.items_to_add_raw.push({
        name: tad.weapon_2,
        type: "weapon",
        data: {
            actionType: "rwak",
            quantity: 1,
            price: tad.weapon_2_value,
        },
        img: weapon[key].img,
        weaponType: "martialRanged"
    });

}