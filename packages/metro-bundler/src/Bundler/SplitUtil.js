'use strict';

const fs = require('fs');
const path = require('path');

let _gProjectRoot = null;

// 配置表的全路径 
let _gSplitConfigPath = null;

let _gSplitConfig = null;

// 公共节点 id 和路径对照表
let _commonCells = null;

let _gDepsInfo = Object.create(null);

class SplitUtil {

  constructor(){
    console.log("SplitUtil.constructor 1.0");

    if (_gProjectRoot == null){
      this._prepare();
    }
  }

  addDepEntry(localpath, depmap){
    // console.log("[SplitUtil] addDepEntry");
    // console.log("path=" + localpath);
    // console.log("depmap=");
    // console.log(depmap);

    _gDepsInfo[path.join(_gProjectRoot, localpath)] = depmap;
  }

  /**
   * 获取项目的根目录
   */
  getProjectDir() {
    return _gProjectRoot;
  }

  _prepare(){
    
    // 项目路径
    console.log("SplitUtil.prepare ...");
    _gProjectRoot = path.join(__dirname, '../../../..');
    

    // 配置表路径
    if (_gSplitConfigPath == null){
      _gSplitConfigPath = path.join(_gProjectRoot, './splitUtil/config.json');
    }

    // 创建 生成文件的临时目录
    // _gSplitWorkspacePath = path.join(_gProjectRoot, "split-bundle");
    // if (! fs.existsSync(_gSplitWorkspacePath)){
    //   fs.mkdirSync(_gSplitWorkspacePath);
    // }

    // 读取 ./splitUtil/config.json 的内容
    let data = fs.readFileSync(_gSplitConfigPath, "utf8");
    _gSplitConfig = JSON.parse(data);
    // this._getSplitConfig();

    
    // 读取 input 的内容
    // todo by jacksonke 
    // 读取失败会如何？
    data = fs.readFileSync(_gSplitConfig.input, "utf8");
    let inputJson = JSON.parse(data);
    _commonCells = inputJson.table;

    _gSplitConfig.lastMaxId = inputJson.lastMaxId;

    console.log("SplitUtil.prepare ... over");
  }


  saveCommonExport(modules:Array){
    console.log("[SplitUtil]saveCommonExport");
    let outputPath = path.join(_gProjectRoot, _gSplitConfig.output);
    let depsPath = path.join(_gProjectRoot, _gSplitConfig.depOutput);

    console.log(_gDepsInfo);

    let obj = {
      table: []
    };

    let dep = {};

    let maxId = 0;

    modules.forEach(module => {
      // if (module.id === 105){
      //   console.log(module);
      // }

      if (module.id > maxId){
        maxId = module.id;
      }

      {
        let depMap = _gDepsInfo[module.sourcePath];
        if (depMap === undefined){
          console.log("No match:" + module.sourcePath);
        }
        else{
          let depIds = Object.values(depMap);
          dep[module.id]= depIds;
        }
      }
      
      // dep[module.id]=module.meta.dependencies;

      obj.table.push({id:module.id, path:path.relative(this.getProjectDir(), module.sourcePath)});
    });

    // 记录本次最大的 id 值
    obj.lastMaxId = maxId + 1;
    let json = JSON.stringify(obj);

    // todo by jacksonke
    // 文件夹要创建

    // let outputdir = path.dirname(output);
    // if (! fs.existsSync(outputdir)){
    //   fs.mkdirSync(outputdir);
    // }

    fs.writeFileSync(outputPath, json, 'utf8');

    // 保存依赖
    let depJson = JSON.stringify(dep);
    fs.writeFileSync(depsPath, depJson, 'utf8');
  }

  fillCommonExport(fileToIdMap){
    if (_commonCells == null){
      return;
    }

    _commonCells.forEach(item => {
      fileToIdMap[path.join(_gProjectRoot, item.path)] = item.id;
    })
  }

  // 获取 moduleId的最小值。这个最小值就是上一次bundle的最大值
  getBaseId(){
    if (_gSplitConfig.lastMaxId){
      return _gSplitConfig.lastMaxId;
    }
    
    return 0;
  }
}


module.exports = SplitUtil;