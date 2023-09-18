// import {loadJsonFile} from 'load-json-file';
// import fs from "fs/promises";
const jsonfile = require('jsonfile')
const crypto = require('crypto');
// const fs = require('fs');
const {join} = require("path");

// const file_steps ="./tasks_steps.json";
/**
 *  创建并且打乱任务
 * @param task_template 设置任务生成模板
 * @param stepped 是否每次只生成一步

 */
exports.getScheduler =  (config, {project})=> {
  console.log(process.cwd());
  console.log(__dirname)
  let json = `./${project}.json`
  let task_template;
  try{
     task_template =  jsonfile.readFileSync(join(process.cwd(),json));
  }
  catch (err){
    console.error(err);
    return;
  }


  let {task_steps,target_tasks} = buildNextTasks(task_template,config, true)
  let currentTasks =  realializeTasks(target_tasks, task_template);
  console.log(JSON.stringify({task_steps,currentTasks}))
  return {task_steps,currentTasks}
}
/**
 * 对每个任务进行实例化,时间总是从当前算起。因此前面的任务执行完毕后，再使用这个函数，可以得到下一批任务以及执行时间
 * @param tasks 对应任务模板中的任务id
 * @param task_template 任务模板，里面有任务所需要对应的时间间隔
 * @returns
 */
function realializeTasks( tasks, task_template) {
  let extract_tasks = [];
  for (let i = 0; i < tasks.length; i++) {
    if (task_template.groups[tasks[i]]) {
      const groups_tasks = task_template.groups[tasks[i]].tasks;
      for (let j = 0; j < groups_tasks.length; j++) {
        extract_tasks.push({ time: null, task_id: groups_tasks[j].id });
      }
    } else {
      extract_tasks.push({ time: null, task_id: tasks[i] });
    }
  }
  let start_time = new Date().getTime();

  //extract time
  for (let i = 0; i < extract_tasks.length; i++) {
    const task = task_template.tasks[extract_tasks[i].task_id];
    if (!task) {
      throw new Error(`task ${extract_tasks[i].task_id} not found`);
    }

    let differ = task.interval * 3600 * 0.2 * (Math.random() -0.5);

    const seconds = (task.interval * 3600 + differ) * 1000;
    start_time += seconds;
    extract_tasks[i].time = new Date(start_time);

    // console.log(
    //   `| ${extract_tasks[i].time}\t\t| ${extract_tasks[i].task_id}\t\t|`
    // );
  }

  return extract_tasks;
}
/**
 *
 * @param task_template 任务模板
 * @param stepped 是否是每次只生成一步
 * @returns 创建的结果
 */
function buildNextTasks(task_template, config,stepped) {


  let target_tasks = [];
  let task_steps = {}
  let repeatable = task_template.template.repeatable;

  if (stepped) {
    let hash = crypto.createHash("sha256");
    hash.update(JSON.stringify(task_template));
    let task_hash = hash.digest("hex");


    try {
      task_steps =  JSON.parse(config);
    }
    catch(e) {
      task_steps = {};
    };
    // if (task_steps[task_hash] === undefined) {
    //   task_steps[task_hash] = {};
    // }
    task_steps.current_step = task_steps.current_step || 0;

    if (task_steps.current_step == 0) {
      target_tasks = task_template.template.mandatory.tasks;

      if(task_steps.task_hash !== task_hash) {
        task_steps.task_ids = buildRepeatableTaskIds(repeatable);
        task_steps.task_hash = task_hash;
      }

    } else {
      target_tasks = buildRepeatableTasks(
        task_steps.task_ids,
        task_steps.exist_tasks,
        repeatable,
          task_steps.current_step
      );
    }
    task_steps.current_step = task_steps.current_step += 1;
    task_steps.exist_tasks = (task_steps.exist_tasks || []).concat(target_tasks);
    // fs.writeFileSync(file_steps, JSON.stringify(task_steps));
  } else {
    let mandatory = task_template.template.mandatory.tasks;
    let repeatable_tasks = buildRepeatableTasks(
      buildRepeatableTaskIds(repeatable),
      [],
      repeatable,
      0
    );
    target_tasks = mandatory.concat(repeatable_tasks);
  }
  // mandatory.concat(repeatable_tasks);
  // console.log(`\r\n============= all tasks =================`);
  // for (let i = 0; i < target_tasks.length; i++) {
  //   console.log(`| ${target_tasks[i]}\t\t|`);
  // }

  return {task_steps,target_tasks};
}
/**
 * 根据模板的选择，创建模板中可重复的任务ID
 * @param {*} repeatable 可重复的创建模板
 * @returns
 */
function buildRepeatableTaskIds(repeatable) {
  //select tasks from template
  let ids = [];
  if (repeatable.counts > repeatable.tasks.length) {
    throw new Error("repeatable counts is more than repeatable tasks");
  }
  //从总任务中选出counts个任务
  const task_ids = Object.keys(repeatable.tasks);
  let with_infinite = false;
  while (ids.length < repeatable.counts) {
    let id = Math.floor(Math.random() * task_ids.length);
    if (ids.indexOf(task_ids[id]) == -1) {
      ids.push(task_ids[id]);
      if (repeatable.tasks[task_ids[id]] == 0) {
        with_infinite = true;
      }
    }
  }
  //至少放一个无限的，以防止任务无法完成
  if (!with_infinite) {
    for (let item in task_ids) {
      if (repeatable.tasks[item] == 0) {
        ids.push(item);
        with_infinite = true;
        break;
      }
    }
  }
  return ids;
}
/**
 *
 * @param ids 可选的任务id
 * @param repeatable_tasks，当前已经选择的任务组
 * @param repeatable, 期望的任务模板以及相应的限制信息
 * @param max_test， 最多尝试次数
 * @returns
 */
function getAnItem(ids, repeatable_tasks, repeatable, max_test) {
  while (max_test > 0) {
    let index = Math.floor(Math.random() * ids.length);
    let intend_item = ids[index];
    let max_repeat = repeatable.tasks[intend_item];
    if (
      max_repeat == 0 ||
      repeatable_tasks.filter((item) => item == intend_item).length < max_repeat
    ) {
      return intend_item;
    }
    max_test -= 1;
    if (max_test < 1) {
        throw new Error("can not find a task");
      return undefined;
    }
  }
}
/**
 *
 * @param ids 所有可以选择的任务ID
 * @param cur_tasks 当前已经创建的任务列表
 * @param repeatable 期望的任务模板以及相应的限制信息
 * @param current_step 当前步骤，0表示所有的一次性生成，其他的表示按步生成
 * @returns
 */
function buildRepeatableTasks(ids, cur_tasks, repeatable, current_step) {
  let repeatable_tasks = cur_tasks ||[];
  let results = [];

  if (current_step == 0) {
    while (repeatable_tasks.length < repeatable.amounts) {
      repeatable_tasks.push(
        getAnItem(ids, repeatable_tasks, repeatable, 10000)
      );
    }
  } else {
    //only once
    repeatable_tasks = [getAnItem(ids, repeatable_tasks, repeatable, 10000)];
  }

  // console.log(`============= repeatable tasks =================`);
  //
  // for (let i = 0; i < repeatable_tasks.length; i++) {
  //   console.log(`| ${repeatable_tasks[i]}\t\t\t\t\t|`);
  // }
  return repeatable_tasks;
}
