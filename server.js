
	console.log('');
	console.log('');

// G L O B A L S
	GLOBAL.CIO=require('./ns')();
	CIO.require=require('nowpaper-global/require');
	CIO.rdbSelect=require('./rdb-select');
	CIO.rdbMysql=require('./rdb-mysql');
	CIO.bcrypt=require('bcrypt');

// L O A D - S E T T I N G S
	CIO.loadConfig('config',__dirname,function(data){
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
	request.use(cookieParser());
	request.use(express.static(__dirname+'/static'));

	CIO.business=function(){

// E X P R E S S
		request.get('/',function(req,res){
			res.send('Go Away');
		});

		//first time opening app
		//device,devicePlatform,deviceVersion,deviceModel,nickname,password1,password2
		request.post('/user/init',function(req,res){
			//confirm 2 passwords the same (also done on app, but never trust anything)
			if(req.param('password1')!==req.param('password2')){
				res.json({status:'error',message:'Passwords do not match.'});
				return;
			}
			//check for dup device id & nickname (so they can differenciate accounts if they want more than one)
			CIO.mysql.record(user,{id:req.param('user'),deviceId:req.param('device')},function(record){
				if(record)
					res.json({status:'error',message:'Duplicate nickname, please try again.'});
				else{
					//generate a password hash
			    CIO.bcrypt.hash(req.param('password1'),8,function(err,hash){
			    	var record={
			    		deviceId:req.param('deviceId'),
			    		devicePlatform:req.param('devicePlatform'),
			    		deviceVersion:req.param('deviceVersion'),
			    		deviceModel:req.param('deviceModel'),
			    		nickname:req.param('nickname'),
			    		password:hash,
			    		ip:req.ip,
			    		entered:CIO.now()
			    	};
						CIO.mysql.insert('user',record,function(success,id){
							if(success&&id)
								//send back id,success
								res.json({status:'success',id:id});
							else
								//send back unknown error
								res.json({status:'error',message:'Unknown error creating account.'});
						});
			    });
				}
			});
		});

		//get a list of groups, and update the db user information
		//user,device,password|devicePlatform,deviceVersion,deviceModel
		request.post('/user/init',CIO.auth.userCredentials,function(req,res){
		  var select=new CIO.rdbSelect('group');
		  var query=select.fields([
		  		'group.id AS `id`',
		  		'group.name AS `name`',
		  		'group.topic AS `topic`'
		    ])
		  	.join('groupUser',CIO.rdbSelect.and(['groupUser.idGroup','=','group.id'],['groupUser.iduser','=',req.param('user')]))
		  	.where(['group.deleted','!=','1'])
			  .orderBy('`name`')
		    .build();
			CIO.mysql.require(function(mysqlCon,mysql){
				var execute=new CIO.rdbMysql(mysql,mysqlCon,query).execute(function(data){
					//send back [{id,name,topic}]
					if(typeof data=='object'&&typeof data.results=='object'&&data.results.length)
							res.json({status:'success',groups:data.results});
						else
							res.json({status:'success',groups:[]});
				});
			});
		});

		//creating a new group
		//user,device,password|name,topic (both encrypted as key comes from app)
		request.post('/group/create',CIO.auth.userCredentials,function(req,res){
			//unique group name? just for creator?
			var record={
				id:CIO.uuid(),
				idUser:req.param('user'),
				name:req.param('name'),
				topic:req.param('topic'),
				created:CIO.now(),
				admin:CIO.uuid(),
				invite:CIO.uuid(),
				post:CIO.uuid(),
				deleted:0
			};
			CIO.mysql.insert('group',record,function(success,id){
				if(success&&id)
					//send back id,success
					res.json({status:'success',id:record.id,admin:record.admin,invite:record.invite,post:record.post});
				else
					//send back unknown error
					res.json({status:'error',message:'Unknown error creating account.'});
			});
			//send back id,admin,invite,post
		});

		//check invite hash, invite user (permission hashes do not leave device)
		//user,device,password|permission(invite),invitedBy,group,inviteTime
		request.post('/group/invited',CIO.auth.userCredentials,CIO.auth.validGroup,CIO.auth.groupInvited,function(req,res){
			var record={
				idGroup:req.param('group'),
				idUser:req.param('user'),
				idUserInvitedBy:req.param('invitedBy'),
				inviteTime:req.param('inviteTime'),
				entered:CIO.now()
			};
			CIO.mysql.insert('groupUser',record,function(success,id){
				if(success)
					res.json({status:'success'});
				else
					res.json({status:'error');
			});
		});

		//view the most recent posts in a group
		//user,device,password|group
		request.post('/group/view',CIO.auth.userCredentials,CIO.auth.validGroup,CIO.auth.groupRead,function(req,res){
			//send back {posts:[{id,content,entered}]} or {posts:[],topic:''} or {deleted:true}
		  var select=new CIO.rdbSelect('post');
		  var query=select.fields([
		  		'post.id AS `id`',
		  		'post.content AS `content`',
		  		'post.type AS `type`',
		  		'post.entered AS `entered`',
		  		'user.nickname AS `nickname`'
		    ])
		  	.join('user'['user.id','=','post.idUser'])
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

		//get new posts since the last one seen (for polling), also admin group updates
		//user,device,password|group,post
		request.post('/group/view/since',CIO.auth.userCredentials,CIO.auth.validGroup,CIO.auth.groupRead,function(req,res){
			//send back {posts:[{id,content,entered}]} or {posts:[],topic:''} or {deleted:true}
		  var select=new CIO.rdbSelect('post');
		  var query=select.fields([
		  		'post.id AS `id`',
		  		'post.content AS `content`',
		  		'post.type AS `type`',
		  		'post.entered AS `entered`',
		  		'user.nickname AS `nickname`'
		    ])
		  	.join('user'['user.id','=','post.idUser'])
		  	.where(['post.id','',])
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
		//user,device,password|permission,group,content,type
		request.post('/group/post',CIO.auth.userCredentials,CIO.auth.validGroup,CIO.auth.groupPost,function(req,res){
			var record={
				idGroup:req.param('group'),
				idUser:req.param('user'),
				content:req.param('content'),
				type:req.param('type'),
				entered:CIO.now()
			};
			CIO.mysql.insert('post',record,function(success,id){
				if(success)
					res.json({status:'success',id:id});
				else
					res.json({status:'error');
			});
		});

		//change the group topic
		//user,device,password|permission,group,topic
		request.post('/group/topic',CIO.auth.userCredentials,CIO.auth.validGroup,CIO.auth.groupAdmin,function(req,res){
			var update={
				topic:req.param('content')
			};
			CIO.mysql.update('group',req.param('group'),update,function(success){
				res.json({status:(success?'success':'error')});
			});
		});

		//delete the group
		//user,device,password|permission,group
		request.post('/group/delete',CIO.auth.userCredentials,CIO.auth.validGroup,CIO.auth.groupAdmin,function(req,res){
			var update={
				deleted:1
			};
			CIO.mysql.update('group',req.param('group'),update,function(success){
				res.json({status:(success?'success':'error')});
			});
		});

	}

// V A L I D A T I O N  -  M I D D L E W A R E
	CIO.validate={};

	CIO.validate.user=function(req,res,next){
		//verify record
		CIO.mysql.record('user',{id:req.param('user'),deviceId:req.param('device')},function(record){
			if(record){
				//password verification
				CIO.bcrypt.compare(req.param('password'),record.password,function(err,res){
			    if(res==true)return next();
		    	else res.redirect('/');
				});
			}else res.redirect('/');
		});
	}

	//check if valid group, and if it is deleted
	CIO.validate.group=function(req,res,next){
		CIO.mysql.record('group',{id:req.param('group')},function(record){
			if(record)
				if(record.deleted==0){
					req.group=record; //is this bad?
					return next();
				}else res.json({status:'error',message:'Group deleted.',deleted:true});
			else res.json({status:'error',message:'Invalid group specified.'});
		});
	}

	//verify user can read in group and is not banned
	CIO.validate.groupUser=function(req,res,next){
		CIO.mysql.record('groupUser',{idGroup:req.param('group'),idUser:req.param('user')},function(record){
			if(record)
				if(record.banned==0)return next();
				else res.json({status:'error',message:'Banned from group.',banned:true});
			else res.json({status:'error',message:'Invalid Request.'});
		});
		res.redirect('/');
	}

	//verify user in group and permission==group.post
	CIO.validate.groupPost=function(req,res,next){
		if(req.param('permission')==req.group.post)return next();
		else res.json({status:'error',message:'Insufficient privileges (post).'});
	}

	//the invite permission isn't the most secure thing, but I think it is better to be able to invite people offline with NFC, and they still cound read posts if forced invite
	CIO.validate.groupInvited=function(req,res,next){
		if(req.param('permission')==req.group.invite)return next();
		else res.json({status:'error',message:'Insufficient privileges (invite).'});
	}

	//verify user in group and permission==group.admin
	CIO.validate.groupAdmin=function(req,res,next){
		if(req.param('permission')==req.group.admin)return next();
		else res.json({status:'error',message:'Insufficient privileges (invite).'});
	}
