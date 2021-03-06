'use strict';
import _ from 'underscore';
import {PFLog, PFConsole} from './PFLog';
import TAS from 'exports-loader?TAS!TheAaronSheet';
import * as SWUtils from './SWUtils';
import PFConst from './PFConst';
import * as PFUtils  from './PFUtils';
import * as PFUtilsAsync  from './PFUtilsAsync';
import * as PFMacros from './PFMacros';
import * as PFMenus from './PFMenus';
import * as PFDB from './PFDB';
import * as PFAttackOptions from './PFAttackOptions';
import * as PFAttackGrid from './PFAttackGrid';
import * as PFFeatures from './PFFeatures';

var 
optionFields= ['is_sp','hasposrange','hasuses','hasattack','abil-attacktypestr'],
optionRepeatingHelperFields =['ability_type','range_numeric','frequency','abil-attack-type'],
allOptionRepeatingFields=optionFields.concat(optionRepeatingHelperFields),
tabRuleSorted ={
	'class-features':0,
	'feats':1,
	'monster-rule':8,
	'mythic-abilities':3,
	'mythic-feats':1,
	'other':8,
	'racial-traits':2,
	'special-abilities':5,
	'special-attacks':4,
	'special-qualities':7,
	'spell-like-abilities':6,
	'traits':2
},
tabTypeSorted = {
	'Ex':9,
	'Sp':10,
	'Su':11
},
categoryAttrs = ['tabcat-1','tabcat0','tabcat1','tabcat2','tabcat3','tabcat4','tabcat5','tabcat6','tabcat7','tabcat8','tabcat9','tabcat10','tabcat11'],
otherCommandMacros = {
	'ex':" [^{extraordinary-abilities-menu}](~@{character_id}|NPCPREFIXex_button)",
	'sp':" [^{spell-like-abilities-menu}](~@{character_id}|NPCPREFIXsp_button)",
	'su':" [^{supernatural-abilities-menu}](~@{character_id}|NPCPREFIXsu_button)"
},
defaultMacroMap ={
	'abilities': 'default'
},
defaultMacros={
	'default': {
		defaultRepeatingMacro: '&{template:pf_ability} @{toggle_accessible_flag} @{toggle_rounded_flag} {{color=@{rolltemplate_color}}} {{header_image=@{header_image-pf_ability}}} {{character_name=@{character_name}}} {{character_id=@{character_id}}} {{subtitle=^{@{rule_category}}}} {{name=@{name}}} {{rule_category=@{rule_category}}} {{source=@{class-name}}} {{is_sp=@{is_sp}}} {{hasspellrange=@{range_pick}}} {{spell_range=^{@{range_pick}}}} {{casterlevel=[[@{casterlevel}]]}} {{spell_level=[[@{spell_level}]]}} {{hasposrange=@{hasposrange}}} {{custrange=@{range}}} {{range=[[@{range_numeric}]]}} {{save=@{save}}} {{savedc=[[@{savedc}]]}} {{hassr=@{abil-sr}}} {{sr=^{@{abil-sr}}}} {{hasfrequency=@{hasfrequency}}} {{frequency=^{@{frequency}}}} {{next_cast=@{rounds_between}}} {{hasuses=@{hasuses}}} {{uses=@{used}}} {{uses_max=@{used|max}}} {{cust_category=@{cust-category}}} {{concentration=[[@{Concentration-mod}]]}} {{damage=@{damage-macro-text}}} {{damagetype=@{damage-type}}} {{hasattack=@{hasattack}}} {{attacktype=^{@{abil-attacktypestr}}}} {{targetarea=@{targets}}} {{duration=@{duration}}} {{shortdesc=@{short-description}}} {{description=@{description}}} {{deafened_note=@{SpellFailureNote}}}',
		defaultRepeatingMacroMap:{
			'&{template:':{'current':'pf_ability}'},
			'@{toggle_accessible_flag}':{'current':'@{toggle_accessible_flag}'},
			'@{toggle_rounded_flag}':{'current':'@{toggle_rounded_flag}'},
			'{{color=':{'current':'@{rolltemplate_color}}}'},
			'{{header_image=':{'current':'@{header_image-pf_ability}}}','old':['@{header_image-pf_block}}}']},
			'{{character_name=':{'current':'@{character_name}}}'},
			'{{character_id=':{'current':'@{character_id}}}'},
			'{{subtitle=':{'current':'^{@{rule_category}}}}'},
			'{{name=':{'current':'@{name}}}'},
			'{{rule_category=':{'current':'@{rule_category}}}'},
			'{{source=':{'current':'@{class-name}}}'},
			'{{is_sp=':{'current':'=@{is_sp}}}'},
			'{{hasspellrange=':{'current':'@{range_pick}}}'},
			'{{hassave=':{'current':'@{save}}}'},
			'{{spell_range=':{'current':'^{@{range_pick}}}}'},
			'{{hasposrange=':{'current':'@{hasposrange}}}'},
			'{{custrange=':{'current':'@{range}}}'},
			'{{range=':{'current':'[[@{range_numeric}]]}}'},
			'{{save=':{'current':'@{save}}}'},
			'{{savedc=':{'current':'[[@{savedc}]]}}','old':['@{savedc}}}']},
			'{{casterlevel=':{'current':'[[@{casterlevel}]]}}'},
			'{{spell_level=':{'current':'[[@{spell_level}]]}}'},
			'{{hassr=':{'current':'@{abil-sr}}}'},
			'{{sr=':{'current':'^{@{abil-sr}}}}'},
			'{{^{duration}=':{'current':'@{duration}}}'},
			'{{hasfrequency=':{'current':'@{frequency}}}'},
			'{{frequency=':{'current':'^{@{frequency}}}}'},
			'{{next_cast=':{'current':'@{rounds_between}}}'},
			'{{hasuses=':{'current':'@{hasuses}}}'},
			'{{uses=':{'current':'@{used}}}'},
			'{{uses_max=':{'current':'@{used|max}}}'},
			'{{cust_category=':{'current':'@{cust-category}}}'},
			'{{concentration=':{'current':'[[@{Concentration-mod}]]}}','old':['@{Concentration-mod}}','@{Concentration-mod}}}']},
			'{{damage=':{'current':'@{damage-macro-text}}}'},
			'{{damagetype=':{'current':'@{damage-type}}}'},
			'{{hasattack=':{'current':'@{hasattack}}}'},
			'{{attacktype=':{'current':'^{@{abil-attacktypestr}}}}'},
			'{{targetarea=':{'current':'@{targets}}}'},
			'{{shortdesc=':{'current':'@{short-description}}}'},
			'{{description=':{'current':'@{description}}}'},
			'{{deafened_note=':{'current':'@{SpellFailureNote}}}'}
			},
		defaultDeletedArray: null
	}
},
events = {
	attackEventsSLA:["damage-macro-text","damage-type","abil-sr","save","abil-attack-type","name","range_numeric"],
	commandMacroFields:["name","used","used_max","showinmenu","ability_type","frequency","rule_category"]
};
/** sets tab for an ability. these have multiple checkboxes, not a radio
 *@param {string} id optional id of row
 *@param {function} callback call when done
 *@param {obj} eventInfo from 'on' event change:rule_category
 */
function setRuleTab (id,callback, eventInfo){
	var idStr = SWUtils.getRepeatingIDStr(id),
	prefix = "repeating_ability_" + idStr,
	catfields=[],
	ruleCategoryField=prefix+"rule_category",
	abilityTypeField=prefix+'ability_type',
	fields=[ruleCategoryField,abilityTypeField];
	catfields=_.map(categoryAttrs,function(attr){
		return prefix+attr;
	});
	fields = fields.concat(catfields);
	getAttrs(fields,function(v){
		var setter, ruleType=0,abilityType=0;
		setter = _.reduce(catfields,function(m,attr){
			m[attr]=0;
			return m;
		},{});
		if (v[abilityTypeField] ){
			abilityType= tabTypeSorted[v[abilityTypeField]];
			setter[prefix+'tabcat'+abilityType]=1;
		}
		if (v[ruleCategoryField]) {
			ruleType=tabRuleSorted[v[ruleCategoryField]];
			setter[prefix+'tabcat'+ruleType]=1;
			setter[prefix+'tabcat-1']=0;
		} else {
			setter[prefix+'tabcat-1']=1;
		}

		//TAS.debug("PFAbility.setRuleTab, setting",setter);
		setAttrs(setter,PFConst.silentParams);
	});
}
function setRuleTabs (){
	getSectionIDs("repeating_ability",function(ids){
		_.each(ids,function(id){
			setRuleTab(id);
		});
	});
}

/** returns all rule_category and ability_type used
 * @returns {jsobj} {'rules':[values of rule_category], 'types':[valuesof ability_type]}
 */
function getAbilityTypes (callback){
	var done= function(typeObj){
		//TAS.debug('PFFeatures.getAbilityTypes returning with ',typeObj);
		if (typeof callback === "function"){
			callback(typeObj);
		}
	};
	getSectionIDs('repeating_ability',function(ids){
		var fields=[];
		if(!ids || _.size(ids)===0){
			done({'rules':[],'types':[]});
			return;
		}
		_.each(ids,function(id){
			var prefix='repeating_ability_'+id+'_';
			fields.push(prefix+'rule_category');
			fields.push(prefix+'showinmenu');
			fields.push(prefix+'ability_type');
		});
		getAttrs(fields,function(v){
			var basearray=[], rulearray = [], typearray=[];
			basearray = _.chain(ids)
				.map(function(id){
					var retObj={},prefix='repeating_ability_'+id+'_';
					retObj.id =id;
					retObj.showinmenu=parseInt(v[prefix+'showinmenu'],10)||0;
					retObj.rule_category = v[prefix+'rule_category']||'';
					retObj.ability_type=(v[prefix+'ability_type']||'').toLowerCase();
					//TAS.debug("row "+id+" is ",retObj);
					return retObj;
				})
				.filter(function(o){return o.showinmenu;})
				.value();

			if (basearray){
				rulearray = _.chain(basearray)
					.groupBy('rule_category')
					.keys()
					.compact()
					.value();
				typearray= _.chain(basearray)
					.groupBy('ability_type')
					.keys()
					.compact()
					.value();
			}
			if (!rulearray){rulearray=[];}
			if (!typearray){typearray=[];}
			done({'rules':rulearray,'types':typearray});
		});
	});
}
/** resetTopCommandMacro sets all-abilities_buttons_macro (menu of ability menus)
 *@param {function} callback call when done	
 */
function getTopOfMenu (callback,isNPC){
	var done = function (str) {
		TAS.debug("leaving PFAbility.getTopOfMenu");
		if (typeof callback === "function") {
			callback(str);
		}
	},
	newMacro="",setter={};
	try {
		newMacro = " @{orig_ability_header_macro}";
		getAbilityTypes(function(used){
			var addlMacros="",
			prefix="";
			try {
				if (isNPC){
					prefix="NPC-";
				}
				if(used.types ){
					_.each(used.types,function(type){
						if(otherCommandMacros[type]){
							addlMacros += otherCommandMacros[type].replace("NPCPREFIX",prefix);
						} else if (type) {
							TAS.warn("cound not find top macro for "+type);
						}
					});
				}
				if(addlMacros){
					newMacro += " {{row03=^{ability-menus}}} {{row04=" + addlMacros + "}}";
				}
				//TAS.debug("PFAbility.getTopOfMenu: done building top macro it is :",newMacro);
			} catch (innererr){
				TAS.error("PFAbility.getTopOfMenu innererr",innererr);
			} finally {
				done(newMacro);
			}
		});
	} catch(err) {
		TAS.error("PFAbility.getTopOfMenu",err);
		done(newMacro);
	}
}
export function resetCommandMacro (callback){
	getAttrs(['is_npc'],function(v){
		var isNPC = parseInt(v.is_npc,10)||0;
		getTopOfMenu ( function(header){
			PFMenus.resetOneCommandMacro('ability',isNPC,null,header);
		}, isNPC);
		PFMenus.resetOneCommandMacro('ex',isNPC);
		PFMenus.resetOneCommandMacro('sp',isNPC);
		PFMenus.resetOneCommandMacro('su',isNPC);
		if (isNPC){
			getTopOfMenu ( function(header){
				PFMenus.resetOneCommandMacro('ability',false,null,header);
			});
			PFMenus.resetOneCommandMacro('ex');
			PFMenus.resetOneCommandMacro('sp');
			PFMenus.resetOneCommandMacro('su');
		}
		if (typeof callback === "function"){
			callback();
		}
	});
}
export function importFromCompendium (callback,eventInfo){
	var done=_.once(function(){
		resetCommandMacro();
		TAS.debug("leaving PFAbility.importFromCompendium");
		if(typeof callback === "function"){
			callback();
		}
	}),
	id = SWUtils.getRowId(eventInfo.sourceAttribute), //row doesn't really exist yet so get id from event
	prefix='repeating_ability_'+id+'_';
	//TAS.debug"at PFAbility.importFromCompendium for "+ prefix);
	getAttrs(['is_undead',prefix+'name',prefix+'compendium_category',prefix+'rule_category', prefix+'ability_type_compendium',prefix+'ability_type',prefix+'description',
	prefix+'range_from_compendium',prefix+'target_from_compendium',prefix+'area_from_compendium',prefix+'effect_from_compendium'],function(v){
		var compcat='' , abilitytype='',ability_basis='',location='',setter={},newcat='', abilname ='',silentSetter={}, match, note='',areaEffectText='',newRangeSettings;
		try {
			//TAS.debug("PFAbility.importFromCompendium got values: ",v);
			if(v[prefix+'ability_type_compendium']){
				abilitytype=v[prefix+'ability_type_compendium'];
				setter[prefix+'ability_type']=abilitytype;
				silentSetter[prefix+'ability_type_compendium']="";
			}
			compcat = v[prefix+'compendium_category'];
			silentSetter[prefix+'compendium_category']="";
			if (compcat){
				compcat=compcat.toLowerCase();
				if (compcat==='feats') {
					newcat='feats';
				} else if (compcat==='monster rule'){
					newcat='monster-rule';
				} else if (compcat==='spell'){
					newcat='spell-like-abilities';
				}
				if (newcat === 'monster-rule'){
					if( v[prefix+'description']){
						match=v[prefix+'description'].match(/Location\:\s*(.*)$/i);
						//TAS.debug"matching "+match);
						if(match && match[1]){
							location=SWUtils.trimBoth(match[1].toLowerCase());
							match = location.match(/special qual|sq|special att|special abil|defens|spell/i);
							if (match){
								switch(match[0]){
									case 'special qual':
									case 'sq':
										newcat='special-qualities';break;
									case 'special att':
										newcat='special-attacks';break;
									case 'special abil':
										newcat='special-abilities';break;
									case 'defens':
										newcat='defensive-abilities';break;
									case 'spell':
										newcat='spell-like-abilities';break;
								}
							}
						}
					}
				}
				if(abilitytype==='Sp'  && !newcat){
					newcat='spell-like-abilities';
				}
				if(!abilitytype && newcat==='spell-like-abilities'){
					abilitytype='Sp';
					setter[prefix+'ability_type']='Sp';
				} else if (abilitytype === 'Sp' && !newcat){
					newcat='spell-like-abilities';
				}
				
				if (newcat){
					setter[prefix+'rule_category']=newcat;
				} else {
					note+=compcat;
				}
				if (abilitytype==='Sp'){
					areaEffectText = v[prefix+'target_from_compendium']|| 
						v[prefix+'area_from_compendium']|| v[prefix+'effect_from_compendium']|| "";
					setter[prefix+'targets'] = areaEffectText;
					if(v[prefix+'range_from_compendium']){
						newRangeSettings = PFUtils.parseSpellRangeText(v[prefix+'range_from_compendium'], areaEffectText);
						setter[prefix+"range_pick"] = newRangeSettings.dropdown;
						setter[prefix+"range"] = newRangeSettings.rangetext;
					}
					setter[prefix+'ability-basis']= '@{CHA-mod}';
					
				} else if ( v[prefix+'name']){
					abilname = v[prefix+'name'].tolowercase();
					abilname = abilname.match(/^[^(]+/);
					if(PFDB.specialAttackDCAbilityBase[abilname]){
						ability_basis= PFDB.specialAttackDCAbilityBase[abilname];
					} else {
						ability_basis = 'CON';
					}
					if (ability_basis === 'CON' && parseInt(v.is_undead,10)){
						ability_basis = 'CHA';
					}
					ability_basis ='@{'+ability_basis+'}';
					setter[prefix+'ability-basis']= ability_basis;
				}
			}
		} catch (err){
			TAS.error("PFAbility.importFromCompendium",err);
		} finally {
			if(_.size(silentSetter)>0){
				setAttrs(silentSetter,PFConst.silentParams);
			}
			//TAS.debug"PFAbility.importFromCompendium, setting",setter);
			if (_.size(setter)>0){
				setAttrs(setter,{},done);
			} else {
				done();
			}
		}
		
	});
}
function setClassName (id,callback,eventInfo){
	var done = _.once(function(){
		if (typeof callback === "function"){
			callback();
		}
	}),
	idStr = SWUtils.getRepeatingIDStr(id),
	prefix="repeating_ability_"+idStr,
	clbasisField=prefix+"CL-basis";
	getAttrs([prefix+'CL-basis',prefix+'class-name',"race","class-0-name","class-1-name","class-2-name","class-3-name","class-4-name","class-5-name"],function(v){
		var clBase='',setter={},match;
		try {
			if (v[clbasisField]){
				if (v[clbasisField]==="@{level}"){
					clBase =v["race"];
				} else if (v[clbasisField]==="@{npc-hd-num}"){
					clBase = v["race"];
				} else if (parseInt(v[clbasisField],10)===0){
					clBase ="";
				} else {
					match = v[prefix+"CL-basis"].match(/\d+/);
					if (match){
						clBase=v["class-"+match[0]+"-name"];
					}
				}
				if(v[prefix+'class-name']!==clBase){
					setter[prefix+'class-name']=clBase;
				}
			}
		} catch(err) {
			TAS.error("PFAbility.setClassName",err);
		} finally {
			if (_.size(setter)>0){
				setAttrs(setter,PFConst.silentParams,done);
			} else {
				done();
			}
		}
	});
}
export function setAttackEntryVals (spellPrefix,weaponPrefix,v,setter,noName){
	var notes="",attackType="";
	setter = setter||{};
	try {
		attackType=PFUtils.findAbilityInString(v[spellPrefix + "abil-attack-type"]);
		if (v[spellPrefix + "name"]) {
			if(!noName){
				setter[weaponPrefix + "name"] = v[spellPrefix + "name"];
			}
			setter[weaponPrefix + "source-spell-name"] = v[spellPrefix + "name"];
		}
		if (attackType) {
			setter[weaponPrefix + "attack-type"] = v[spellPrefix + "abil-attack-type"];
			if ((/CMB/i).test(attackType)) {
				setter[weaponPrefix + "vs"] = "cmd";
			} else if ((/ranged/i).test(attackType)) {
				setter[weaponPrefix + "vs"] = "touch";
				setter[weaponPrefix + "isranged"] = 1;
				setter[weaponPrefix+"range"] = v[spellPrefix+"range_numeric"];
			} else {
				setter[weaponPrefix + "vs"] = "touch";
			}
		}

		if (v[spellPrefix +"damage-macro-text"]){
			setter[weaponPrefix+"precision_dmg_macro"] = v[spellPrefix+"damage-macro-text"];
			if(attackType){
				setter[weaponPrefix+"critical_dmg_macro"] = v[spellPrefix+"damage-macro-text"];
			} else {
				setter[weaponPrefix+"critical_dmg_macro"]="";
			}
		}
		if (v[spellPrefix+ "damage-type"]){
			setter[weaponPrefix+"precision_dmg_type"] = v[spellPrefix+"damage-type"];
			if(attackType){
				setter[weaponPrefix+"critical_dmg_type"] = v[spellPrefix+"damage-type"];
			}else {
				setter[weaponPrefix+"critical_dmg_type"]="";
			}
		}

		if (v[spellPrefix+"save"]){
			if (notes) { notes += ", ";}
			notes += "Save: "+ v[spellPrefix+"save"] + " DC: [[@{" + spellPrefix + "savedc}]]";
		}
		if ( v[spellPrefix+"sr"]){
			if (notes) { notes += ", ";}
			notes += "Spell resist:"+ v[spellPrefix+"abil-sr"];
		}
		if (notes){
			setter[weaponPrefix+"notes"]=notes;
		}
	} catch (err){
		TAS.error("PFAbility.setAttackEntryVals",err);
	} finally {
		return setter;
	}
}
/**Triggered from a button in repeating spells 
 *@param {string} id the row id or null
 *@param {function} callback when done
 *@param {boolean} silently setattrs silent:true
 *@param {object} eventInfo if id is null get id from here.
 */
export function createAttackEntryFromRow (id, callback, silently, eventInfo, weaponId) {
	var done = _.once(function () {
		TAS.debug("leaving PFAbility.createAttackEntryFromRow");
		if (typeof callback === "function") {
			callback();
		}
	}),
	attribList = [],
	itemId = id || (eventInfo ? SWUtils.getRowId(eventInfo.sourceAttribute) : ""),
	//idStr = SWUtils.getRepeatingIDStr(itemId),
	item_entry = 'repeating_ability_' + itemId + '_',
	slaPrefix = item_entry , //'repeating_ability_' + idStr,
	attributes = ["range_numeric","damage-macro-text","damage-type","abil-sr","savedc","save","abil-attack-type", "name"]
	;
	if(!itemId){
		TAS.warn("Cannot create usable attack entry from SLA since we cannot identify the row id");
	}
	attributes.forEach(function(attr){
		attribList.push(slaPrefix +  attr);
	});

	//TAS.debug("PFAbility.createAttackEntryFromRow: attribList=" + attribList);
	getAttrs(attribList, function (v) {
		var newRowId="",
		setter = {},
		prefix = "repeating_weapon_",
		idStr="",
		params = {};
		try {
			//TAS.debug("at PFAbility.createAttackEntryFromRow",v);
			if (!PFUtils.findAbilityInString(v[slaPrefix + "abil-attack-type"]) && !v[slaPrefix+"damage-macro-text"]){
				TAS.warn("no attack to create for ability "+ v[slaPrefix+"name"] +", "+ itemId );
			} else {
				if (!weaponId){
					newRowId = generateRowID();
				} else {
					newRowId = weaponId;
				}
				idStr = newRowId+"_";
				prefix += idStr;
				setter = setAttackEntryVals(item_entry, prefix,v,setter,weaponId);
				setter[prefix + "source-ability"] = itemId;
				setter[prefix+"group"]="Special";
			}
		} catch (err) {
			TAS.error("PFAbility.createAttackEntryFromRow", err);
		} finally {
			if (_.size(setter)>0){
				setter[slaPrefix + "create-attack-entry"] = 0;
				if (silently) {
					params = PFConst.silentParams;
				}
				//TAS.debug("PFAbility.createAttackEntryFromRow setting:",setter);
				setAttrs(setter, {}, function(){
					//can do these in parallel
					//TAS.debug("PFAbility.createAttackEntryFromRow came back from setter ");
					PFAttackOptions.resetOption(newRowId);
					PFAttackGrid.resetCommandMacro();
					done();
				});
			} else {
				setter[slaPrefix + "create-attack-entry"] = 0;
				setAttrs(setter,PFConst.silentParams,done);
			}
		}
	});
}
export function updateAssociatedAttack (id, callback, silently, eventInfo) {
	var done = _.once(function () {
		TAS.debug("leaving PFAbility.updateAssociatedAttack");
		if (typeof callback === "function") {
			callback();
		}
	}),
	itemId = "", item_entry = "",attrib = "", attributes=[];
	itemId = id || (eventInfo ? SWUtils.getRowId(eventInfo.sourceAttribute) : "");
	item_entry = 'repeating_spells_' + SWUtils.getRepeatingIDStr(itemId);
	attrib = (eventInfo ? SWUtils.getAttributeName(eventInfo.sourceAttribute) : "");
	attributes=[];
	//TAS.debug("at PF Spell like abilities updateAssociatedAttack: for row" + id   );
	if (attrib){
		attributes = [item_entry+attrib];
		if ((/range/i).test(attrib)){
			attributes =[item_entry+'range_pick',item_entry+'range',item_entry+'range_numeric'];
		}
	} else {
		attributes = ["range_pick","range","range_numeric","damage-macro-text","damage-type","sr","savedc","save","abil-attack-type","name"];
	}
	getAttrs(attributes,function(spellVal){
		getSectionIDs("repeating_weapon", function (idarray) { // get the repeating set
			var spellsourcesFields=[];
			spellsourcesFields = _.reduce(idarray,function(memo,currentID){
				memo.push("repeating_weapon_"+currentID+"_source-ability");
				return memo;
			},[]);
			getAttrs(spellsourcesFields,function(v){
				var setter={}, params={},idlist=[];
				try {
					_.each(idarray,function(currentID){
						var prefix = "repeating_weapon_"+currentID+"_";
						if (v[prefix+"source-ability"]===itemId){
							idlist.push(currentID);
							setter= setAttackEntryVals(item_entry, prefix,spellVal,setter);
						}
					});
				} catch (err){
					TAS.error("PFAbility.updateAssociatedAttack",err);
				} finally {
					if (_.size(setter)>0){
						if (silently) {
							params = PFConst.silentParams;
						}
						setAttrs(setter, params, function(){
							PFAttackOptions.resetSomeOptions(idlist);
						});
					} else {
						done();
					}
				}
			});
		});
	});
}
function updateCharLevel (id,callback,eventInfo){
	var done=_.once(function(){
		TAS.debug("leaving updateCharLevel");
		if (typeof callback === "function"){
			callback();
		}
	}),
	idStr = SWUtils.getRepeatingIDStr(id),
	prefix = "repeating_ability_"+idStr;
	getAttrs([prefix+"CL-misc-mod",prefix+"CL-basis-mod",prefix+"casterlevel",prefix+"ability_type","buff_CasterLevel-total", "CasterLevel-Penalty"],function(v){
		var clBase=0,cl=0,misc=0,pen=0,isSP=0,setter={};
		try {
			isSP=parseInt(v[prefix+"ability_type"],10)||0;
			clBase = parseInt(v[prefix+"CL-basis-mod"],10)||0;
			misc= parseInt(v[prefix+"CL-misc-mod"],10)||0;
			pen = parseInt(v["CasterLevel-Penalty"],10)||0;
			cl= clBase+misc+pen;
			if (isSP){
				cl+=parseInt(v["buff_CasterLevel-total"],10)||0;
			}
			if (cl !== parseInt(v[prefix+'casterlevel'],10)){
				setter[prefix+'casterlevel']=cl;
			}
		} catch (err){
			TAS.error("PFAbility.updateCharLevel",err);
		} finally {
			if (_.size(setter)){
				setAttrs(setter,{},done);
			} else {
				done();
			}
		}
	});
}
function updateAbilityRange (id, callback, silently, eventInfo){
	var done=_.once(function(){
		TAS.debug("leaving updateAbilityRange");
		if (typeof callback === "function"){
			callback();
		}
	}),
	idStr = SWUtils.getRepeatingIDStr(id),
	prefix = "repeating_ability_"+idStr;
	getAttrs([prefix+"range_pick",prefix+"range",prefix+"range_numeric",prefix+"casterlevel",prefix+"ability_type"], function(v){
		var  newRange=0,currRange=0,cl=0,setter={},isSP=0,currPosRange=0;
		try {
			isSP=(v[prefix+'ability_type']==='Sp')?1:0;
			currRange = parseInt(v[prefix+"range_numeric"],10)||0;
			if(isSP){
				cl=parseInt(v[prefix+'casterlevel'],10)||0;
				newRange = PFUtils.findSpellRange(v[prefix+"range"], v[prefix+"range_pick"], cl)||0;
			} else {
				newRange = parseInt(SWUtils.trimBoth(v[prefix+'range']),10)||0;
			}
			if (newRange!== currRange){
				//TAS.debug("updating range");
				setter[prefix+"range_numeric"]=newRange;
			}
			currPosRange = parseInt(v[prefix+'hasposrange'],10)||0;
			if (newRange > 0 && !currPosRange) {
				setter[prefix+'hasposrange']=1;
			} else if (currPosRange) {
				setter[prefix+'hasposrange']=0;
			}
		} catch (err){
			TAS.error("updateAbilityRange",err);
		} finally {
			if (_.size(setter)){
				setAttrs(setter,{},done);
			} else {
				done();
			}
		}
	});
}
/** to use in calls to _.invoke or otherwise, sets switch variables to setter for given row
 * @param {jsobj} setter to pass in first var of setAttrs
 * @param {string} id the id of this row, or null if we are within the row context already
 * @param {jsobj} v the values needed returned by getAttrs
 */
function resetOption (setter, id, v, eventInfo){
	var idStr=SWUtils.getRepeatingIDStr(id),
	prefix='repeating_ability_'+idStr,
	isSP='', posRange='', hasUses='', hasFrequency='', hasAttack='', atkstr='', attackStrForDisplay='';
	setter= setter||{};
	try {
		if(!v){return setter;}
		isSP= (v[prefix+'ability_type']==='Sp')?'1':'';
		
		if(isSP !== v[prefix+'is_sp']){
			setter[prefix+'is_sp']=isSP;
		}
		posRange=(parseInt(v[prefix+'range_numeric'],10)||0)>0?'1':'';
		if (posRange !== v[prefix+'hasposrange']) {
			setter[prefix+'hasposrange']=posRange;
		}
		if(v[prefix+'frequency'] && v[prefix+'frequency']!=='not-applicable'){
			hasFrequency='1';
			switch(v[prefix+'frequency']){
				case 'perday':
				case 'permonth':
				case 'hexfreq':
				case 'other':
					hasUses='1';
					break;
			}
		}
		if(hasFrequency !== v[prefix+'hasfrequency']){
			setter[prefix+'hasfrequency']=hasFrequency;
		}
		if (hasUses !== v[prefix+'hasuses']){
			setter[prefix+'hasuses']=hasUses;
		}
		if(PFUtils.findAbilityInString(v[prefix+'abil-attack-type'])){
			hasAttack='1';
		}
		if (hasAttack !== v[prefix+'hasattack']){
			setter[prefix+'hasattack']=hasAttack;
		}
		if(hasAttack){
			atkstr=v[prefix+'abil-attack-type'].toLowerCase();
			if(atkstr.indexOf('melee')>=0){
				attackStrForDisplay='touch';
			} else if (atkstr.indexOf('range')>=0){
				attackStrForDisplay='ranged-touch-ray';
			} else if (atkstr.indexOf('cmb')>=0){
				attackStrForDisplay='combat-maneuver-bonus-abbrv';
			}
		}
		if (attackStrForDisplay !== v[prefix+'abil-attacktypestr']){
			setter[prefix+'abil-attacktypestr']=attackStrForDisplay;
		}
	} catch (err){
		TAS.error("PFAbility.recalcAbilities",err);
	} finally {
		return setter;
	}
}
function resetOptionAsync (id, callback , eventInfo){
	var done = _.once(function(){
		TAS.debug("leaving PFAbility.resetOption");
		if (typeof callback === "function"){
			callback();
		}
	}),
	idStr=SWUtils.getRepeatingIDStr(id),
	prefix='repeating_ability_'+idStr,
	fields=[];
	fields = _.map(allOptionRepeatingFields,function(attr){
		return prefix + attr;
	});
	getAttrs(fields,function(v){
		var setter={};
		try {
			setter = resetOption(setter,id,v);
		} catch (err){
			TAS.error("PFAbility.recalcAbilities",err);
		} finally {
			if (_.size(setter)){
				setAttrs(setter,PFConst.silentParams,done,eventInfo);
			} else {
				done();
			}
		}
	});
}
function recalcAbilities (callback,silently, eventInfo,levelOnly){
	var done = _.once(function(){
		TAS.debug("leaving PFAbility.recalcAbilities");
		if (typeof callback === "function"){
			callback();
		}
	});
	getSectionIDs('repeating_ability',function(ids){
		var numids = _.size(ids),
			doneOne, calllevel;
		if(numids===0){
			done();
			return;
		}
		//TAS.debug("there are "+ numids+" rows to recalc");
		doneOne	= _.after(numids,done);
		//refactor to do all rows at once
		calllevel= function(id){
			PFUtilsAsync.setRepeatingDropdownValue('ability',id,'CL-basis','CL-basis-mod',function(){ 
				//TAS.debug("PFAbility.recalcAbilities calling updateCharLevel for "+id);
				updateCharLevel(id,function(){
					TAS.debug("PFAbility.recalcAbilities calling updateAbilityRange for "+id);
					updateAbilityRange(id,function(){
					//	TAS.debug("PFAbility.recalcAbilities calling updateAssociatedAttack for "+id);
					//	updateAssociatedAttack(id,null,false,null);
						doneOne();
					});
				});
			});
		};
		_.each(ids,function(id){
			calllevel(id);
			if (!levelOnly){
				resetOptionAsync(id);
			}
		});
	});
}
export function migrateRepeatingMacros (callback){
	var done = _.once(function(){
		TAS.debug("leaving PFAbility.migrateRepeatingMacros");
		if (typeof callback === "function") {
			callback();
		}
	}),
	migrated = _.once(function(){
		setAttrs({'migrated_ability_macrosv112':1},PFConst.silentParams);
		done();
	}),
	defaultName = '',defaultMacro='',
	section = 'ability';
	getAttrs(['migrated_ability_macrosv112'],function(v){
		try {
			if(!parseInt(v.migrated_ability_macrosv112,10)){
				
				defaultName = defaultMacroMap[section]||'default';
				defaultMacro=defaultMacros[defaultName];
				if (!defaultMacro){
					TAS.error("cannot find default macro for section "+section);
					done();
					return;
				}
				//TAS.debug("PFAbility.migrateRepeatingMacros about to call PFMacros",defaultMacro);
				PFMacros.migrateRepeatingMacros(migrated,section,'macro-text',defaultMacro.defaultRepeatingMacro,defaultMacro.defaultRepeatingMacroMap,defaultMacro.defaultDeletedArray,'@{NPC-whisper}');
			} else {
				migrated();
			} 
		} catch (err){
			TAS.error("PFAbility.migrateRepeatingMacros error setting up "+section,err);
			done();
		}
	});
}
export function migrate (callback){
	var done = function(){
		TAS.debug("leaving PFAbility.migrate");
		if (typeof callback === "function"){
			callback();
		}
	};
	migrateRepeatingMacros(done);
}
export function recalculate (callback, silently, oldversion) {
	var done = _.once(function () {
		TAS.info("leaving PFAbility.recalculate");
		if (typeof callback === "function") {
			callback();
		}
	}),
	doneWithList = function(){
		//TAS.debug("now calling resetcommandmacro");
		resetCommandMacro();
		done();
	},
	callRecalcAbilities = function(){
		//TAS.debug("PF1 calling recalcAbilities");
		recalcAbilities(TAS.callback(doneWithList));
		setRuleTabs();
	};
	try {
		//TAS.debug("at PFAbility.recalculate");
		migrate(TAS.callback(callRecalcAbilities));
	} catch (err) {
		TAS.error("PFAbility.recalculate, ", err);
		done();
	}
}
function registerEventHandlers () {
	var eventToWatch="",
	macroEvent = "remove:repeating_ability ",
	singleEvent = "change:repeating_ability:";

	macroEvent = _.reduce(events.commandMacroFields,function(m,a){
		m+= singleEvent + a + " ";
		return m;
	},macroEvent);
	on (macroEvent, TAS.callback(function eventRepeatingCommandMacroUpdate(eventInfo){
		var attr;
		attr = SWUtils.getAttributeName(eventInfo.sourceAttribute);
		if ( eventInfo.sourceType === "player" || eventInfo.sourceType === "api" || (eventInfo.sourceType === "sheetworker" && attr==='used_max')) {
			PFFeatures.resetTopCommandMacro(null,eventInfo);
			resetCommandMacro();
		}
	}));
	on("change:repeating_ability:CL-basis", TAS.callback(function eventAbilityClassDropdown(eventInfo){
		TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
		SWUtils.evaluateAndSetNumber('repeating_ability_CL-basis','repeating_ability_CL-basis-mod');
		if (eventInfo.sourceType === "player" || eventInfo.sourceType === "api" ) {
			setClassName(null,null,eventInfo);
		}
	}));
	eventToWatch = _.reduce(optionRepeatingHelperFields,function(m,a){
		m+= 'change:repeating_ability:'+a+' ';
		return m;
	},"");
	on(eventToWatch,	TAS.callback(function eventChangeAbilityTypeFrequencyOrRange(eventInfo){
			TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
			if (eventInfo.sourceType === "player" || eventInfo.sourceType === "api" || eventInfo.sourceAttribute.indexOf('range')>0 ) {
				resetOptionAsync();
			}
	}));
	on("change:repeating_ability:CL-misc change:repeating_ability:spell_level-misc", 
		TAS.callback(function eventSLAEquationMacro(eventInfo){
		TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
		SWUtils.evaluateAndSetNumber(eventInfo.sourceAttribute, eventInfo.sourceAttribute+"-mod");
	}));
	on("change:buff_CasterLevel-total change:CasterLevel-Penalty",
		TAS.callback(function eventAbilityLevelChange(eventInfo){
		if (eventInfo.sourceType === "sheetworker"  ) {
			TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
			recalcAbilities(null,null,eventInfo,true);
		}
	}));
	on("change:repeating_ability:CL-basis-mod change:repeating_ability:CL-misc-mod",
		TAS.callback(function eventAbilityLevelChange(eventInfo){
		if (eventInfo.sourceType === "sheetworker"  ) {
			TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
			updateCharLevel(null,null,eventInfo);
		}
	}));
	on("change:repeating_ability:compendium_category", TAS.callback(function eventAbilityCompendium(eventInfo){
		if (eventInfo.sourceAttribute !== "sheetworker"){
			TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
			importFromCompendium(null,eventInfo);
		}
	}));
	on("change:repeating_ability:create-attack-entry", TAS.callback(function eventcreateAttackEntryFromSLA(eventInfo) {
		TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
		if (eventInfo.sourceType === "player" || eventInfo.sourceType === "api") {
			createAttackEntryFromRow(null,null,false,eventInfo);
		}
	}));
	on("change:repeating_ability:CL-misc-mod change:repeating_ability:CL-basis-mod change:repeating_ability:range_pick change:repeating_ability:range",
		TAS.callback(function eventClassRangeMod(eventInfo){
		TAS.debug("caught " + eventInfo.sourceAttribute + " event: " + eventInfo.sourceType);
		//cl-misc-mod, cl-basis-mod  is sheetworker, range_pick and range must be player
		if ( ((/range/i).test(eventInfo.sourceAttribute) && (eventInfo.sourceType === "player" || eventInfo.sourceType === "api" )) || 
			((/CL/i).test(eventInfo.sourceAttribute) && eventInfo.sourceType === "sheetworker") ) {
				updateAbilityRange(null,null,false,eventInfo);
			}
	}));
	eventToWatch = _.reduce(events.attackEventsSLA,function(memo,attr){
		memo+="change:repeating_ability:"+attr+" ";
		return memo;
	},"");
	on(eventToWatch,	TAS.callback(function eventupdateAssociatedSLAttackAttack(eventInfo) {
		TAS.debug("caught " + eventInfo.sourceAttribute + " event" + eventInfo.sourceType);
		if (eventInfo.sourceType === "player" || eventInfo.sourceType === "api" || (eventInfo.sourceType === "sheetworker" && !((/attack\-type/i).test(eventInfo.sourceAttribute) ))) {
			updateAssociatedAttack(null,null,null,eventInfo);
		}
	}));
	on("change:repeating_ability:rule_category change:repeating_ability:ability_type", TAS.callback(function eventUpdateSLARuleCat(eventInfo){
		TAS.debug("caught " + eventInfo.sourceAttribute + " event" + eventInfo.sourceType);
		setRuleTab(null,null,eventInfo);
	}));
}
registerEventHandlers();
PFConsole.log('   PFAbility module loaded        ' );
PFLog.modulecount++;

