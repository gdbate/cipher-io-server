
	console.log('');
	console.log('');

// G L O B A L S
	GLOBAL.CIO=require('./ns')();
	CIO.rdbSelect=require('./rdb-select');
	CIO.rdbMysql=require('./rdb-mysql');

// L O A D - S E T T I N G S
	CIO.loadConfig('config',__dirname,function(data){
		console.log(data);
		if(!data){
			console.log('- Error Reading Settings');
		}else{
			CIO.settings=data;
			CIO.mysql=require('./mysql')(CIO.settings.mysql);
			CIO.mysql.connect();
			CIO.business();
		}
	})

// D E P E N D A N C I E S
	var express=require('express')
	var logger=require('morgan');
	var bodyParser=require('body-parser');
	var methodOverride=require('method-override');

	var request=express();
	request.use(bodyParser());
	request.use(express.static(__dirname+'/static'));

	CIO.business=function(){

// E X P R E S S
		request.route('/').all(function(req,res){
			res.send('Go Away');
		});

		//check if valid cipher server
		//app,device
		request.route('/cipher-server').get(function(req,res){
			var record={
				status:'success',
				owner:CIO.settings.information.owner,
				server:CIO.settings.information.server
			};
			res.json(record);
		});

		//creating a new group
		//app,device|name,topic(both encrypted as key comes from app),admin,invite,post(3 are sha256'd)|nickname,app,deviceId,devicePlatform,deviceVersion,deviceModel
		request.route('/group/create').post(CIO.validate.user,function(req,res){
			var idGroup=CIO.uuid();
			var record={
				id:idGroup,
				name:req.param('name'),
				topic:req.param('topic'),
				created:CIO.now(),
				admin:req.param('admin'),
				invite:req.param('invite'),
				post:req.param('post'),
				deleted:0
			};
			CIO.mysql.insert('group',record,function(success,id){
				if(!success){
					res.json({status:'error',message:'Unknown error creating group.'});
					return;
				}
				var record={
					idGroup:idGroup,
					nickname:req.param('nickname'),
					ip:req.ip,
					appId:req.param('app'),
					deviceId:req.param('device'),
					devicePlatform:req.param('devicePlatform'),
					deviceVersion:req.param('deviceVersion'),
					deviceModel:req.param('deviceModel'),
					entered:CIO.now()
				};
				CIO.mysql.insert('groupUser',record,function(success,id){
					if(!success){
						res.json({status:'error',message:'Could not create user.'});
						return;
					}
					CIO.mysql.update('group',groupId,{idGroupUser:id},function(success){
						if(!success){
							res.json({status:'error',message:'Could not attribute group to user.'});
							return;
						}
						//send back id,success
						res.json({status:'success',id:idGroup});
					});
				});
			});
		});

		//check invite hash, invite user (permission hashes do not leave device)
		//app,device|permission(invite),groupInvitedTo(group ID),nickname,devicePlatform,deviceVersion,deviceModel,invitedBy,inviteTime
		request.route('/group/invited').post(CIO.validate.user,CIO.validate.groupInvited,function(req,res){
			var record={
				idGroup:req.param('group'),
				idGroupUserInvited:req.param('invitedBy'),
				nickname:req.param('nickname'),
				ip:req.ip,
				appId:req.param('app'),
				deviceId:req.param('device'),
				devicePlatform:req.param('devicePlatform'),
				deviceVersion:req.param('deviceVersion'),
				deviceModel:req.param('deviceModel'),
				inviteTime:req.param('inviteTime'),
				entered:CIO.now()
			};
			CIO.mysql.insert('groupUser',record,function(success,id){
				if(success)
					res.json({status:'success'});
				else
					res.json({status:'error'});
			});
		});

		//view the most recent posts in a group
		//group,app,device
		request.route('/group/view').get(CIO.validate.user,function(req,res){
			//send back {posts:[{id,content,entered}]} or {posts:[],topic:''} or {deleted:true}
		  var select=new CIO.rdbSelect('post');
		  var query=select.fields([
		  		'post.id AS `id`',
		  		'post.content AS `content`',
		  		'post.type AS `type`',
		  		'post.entered AS `entered`',
		  		'groupUser.nickname AS `nickname`'
		    ])
		  	.join('groupUser'['groupUser.id','=','post.idGroupUser'])
			  .orderBy('`id DESC`')
			  .limit(10) //could be lots of images
		    .build();
			CIO.mysql.require(function(mysqlCon,mysql){
				var execute=new CIO.rdbMysql(mysql,mysqlCon,query).execute(function(data){
					//send back [{id,content,type,entered,nickname}]
					if(typeof data=='object'&&typeof data.results=='object'&&data.results.length)
							res.json({status:'success',groups:data.results});
						else
							res.json({status:'success',groups:[]});
				});
			});
		});

		//get new posts since the last one seen (for polling)
		//group,app,device|post
		request.route('/group/view/since').get(CIO.validate.user,function(req,res){
			//send back {posts:[{id,content,entered}]} or {posts:[],topic:''} or {deleted:true}
		  var select=new CIO.rdbSelect('post');
		  var query=select.fields([
		  		'post.id AS `id`',
		  		'post.content AS `content`',
		  		'post.type AS `type`',
		  		'post.entered AS `entered`',
		  		'groupUser.nickname AS `nickname`'
		    ])
		  	.join('groupUser'['groupUser.id','=','post.idGroupUser'])
		  	.where(['post.id','>',req.param('post')])
			  .orderBy('`id DESC`')
			  .limit(25) //could be lots of images
		    .build();
			CIO.mysql.require(function(mysqlCon,mysql){
				var execute=new CIO.rdbMysql(mysql,mysqlCon,query).execute(function(data){
					//send back [{id,content,type,entered,nickname}]
					if(typeof data=='object'&&typeof data.results=='object'&&data.results.length)
							res.json({status:'success',groups:data.results});
						else
							res.json({status:'success',groups:[]});
				});
			});
		});

		//post to the group
		//group,app,device|permission,content,type
		request.route('/group/post').post(CIO.validate.user,CIO.validate.groupPost,function(req,res){
			var record={
				idGroup:req.param('group'),
				idUser:req.param('user'),
				content:req.param('content'), //if file save to CDN or ./static
				type:req.param('type'),
				entered:CIO.now()
			};
			CIO.mysql.insert('post',record,function(success,id){
				if(success)
					res.json({status:'success',id:id});
				else
					res.json({status:'error'});
			});
		});

		//change the group topic (still not hooked up)
		//group,app,device,group|permission,topic(encrypted)
		request.route('/group/topic').post(CIO.validate.user,CIO.validate.groupAdmin,function(req,res){
			var update={
				topic:req.param('content')
			};
			CIO.mysql.update('group',req.param('group'),update,function(success){
				res.json({status:(success?'success':'error')});
			});
		});

		//delete the group
		//group,app,device,group|permission
		request.route('/group/delete').post(CIO.validate.user,CIO.validate.groupAdmin,function(req,res){
			var update={
				deleted:1
			};
			CIO.mysql.update('group',req.param('group'),update,function(success){
				res.json({status:(success?'success':'error')});
			});
		});

		//start webserver
		request.listen(CIO.settings.server.port,function(err){
			console.log('+ Webserver Listening on port '+CIO.settings.server.port);
		});
	}

// V A L I D A T I O N  -  M I D D L E W A R E
	CIO.validate={};

	CIO.validate.user=function(req,res,next){
		//verify required information sent
		if(!req.param('app')||!req.param('device')){
			res.json({status:'error',message:'Invalid User.'});
			return;
		}

		//proceed if group not required
		if(!req.param('group'))return next();

		//verify group
		CIO.mysql.record('group',{id:req.param('group')},function(record){
			if(record)
				if(record.deleted==0){
					req.group=record; //is this bad?
					//verify user allowed in group
					CIO.mysql.record('groupUser',{idGroup:req.param('group'),appId:req.param('app'),deviceId:req.param('device')},function(record){
						if(record){
							if(record.banned)res.json({status:'error',message:'Banned from group.',banned:true});
						  else{
								req.groupUser=record;
						  	return next();
						  }
						}else{
							res.json({status:'error',message:'Invalid User.'});
							return;
						}
					});
				}else res.json({status:'error',message:'Group deleted.',deleted:true});
			else res.json({status:'error',message:'Invalid group specified.'});
		});
	}

	//verify user in group and permission==group.post
	CIO.validate.groupPost=function(req,res,next){
		if(req.param('permission')==req.group.post)return next();
		else res.json({status:'error',message:'Insufficient privileges (post).'});
	}

	//the invite permission isn't the most secure thing, but I think it is better to be able to invite people offline with NFC, and they still cound read posts if forced invite
	CIO.validate.groupInvited=function(req,res,next){
		//fetch group, append to res
		CIO.mysql.record('groupUser',req.param('groupInvitedTo'),function(record){
			if(!record){
				res.json({status:'error',message:'Invalid Group.'});
				return;
			}
			req.group=record;
			if(req.param('permission')==req.group.invite)return next();
			else res.json({status:'error',message:'Insufficient privileges (invite).'});
		});
	}

	//verify user in group and permission==group.admin
	CIO.validate.groupAdmin=function(req,res,next){
		if(req.param('permission')==req.group.admin)return next();
		else res.json({status:'error',message:'Insufficient privileges (invite).'});
	}
