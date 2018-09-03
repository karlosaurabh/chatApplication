import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
//ROUTER IMPORTING
import { Router } from '@angular/router'
//TOASTR IMPORTING
import { ToastrService } from 'ngx-toastr';
//FORM
import { FormsModule } from '@angular/forms';
//Http SERVICE IMPORTING
import { AppService } from './../../app.service';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { SocketService } from '../../socket.service';
import { FirstCharComponent } from '../../shared/first-char/first-char.component';
@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.css'],
  providers: [SocketService]
})
export class ChatBoxComponent implements OnInit {

  @ViewChild('scrollMe', { read: ElementRef }) 
  
  public scrollMe: ElementRef; 


  public authToken: any;
  public userInfo: any;
  public userList: any = [];
  public disconnectedSocket: boolean;  

  public scrollToChatTop:boolean= false;

  public receiverId: any;
  public receiverName: any;
  public previousChatList: any = [];
  public messageText: any; 
  public messageList: any = []; // stores the current message list display in chat box
  public pageValue: number = 0;
  public loadingPreviousChat: boolean = false;






  // public authToken: any;
  // public userInfo: any;
  // public receiverId: any;
  // public receiverName: any;
  // public userList = [];
  // public disconnectedSocket: boolean;
  constructor(
    private router: Router,
    private appService: AppService,
    private toastr: ToastrService,
    public SocketService: SocketService
  ) {
    this.receiverId = Cookie.get('receiverId');
    this.receiverName = Cookie.get('receiverName');
  }//chatBoxComponent constructor end

  ngOnInit() {
    this.authToken = Cookie.get('authtoken');
    this.userInfo = this.appService.getUserInfoFromLocalStorage();
    this.checkStatus();
    this.verifyUserConnection();
    this.getOnlineUserList();
  }// ngOnInit end here

  public checkStatus: any = () => {
    if (Cookie.get('authToken') === undefined || Cookie.get('authToken') === '' || Cookie.get('authToken') === null) {
      this.router.navigate(['chat']);
      return false;
    } else {
      return true;
    }
  }//end chekstatus

  public verifyUserConnection: any = () => {
    this.SocketService.verifyUser()
    .subscribe((data)=>{
      this.disconnectedSocket = false;
      this.SocketService.setUser(this.authToken);
      this.getOnlineUserList();
    });
  }//end verifyUserConnection

  public getOnlineUserList: any = () => {
    this.SocketService.onlineUserList()
    .subscribe((userList)=>{
      this.userList = [];
      for(let x in userList){
        let temp = {'userId':x, 'name': userList[x], 'unread': 0, 'chatting': false};
        this.userList.push(temp);
      }
      console.log(this.userList);
    });
  }//end getOnlineUserList


  public getPreviousChatWithAUser :any = ()=>{
    let previousData = (this.messageList.length > 0 ? this.messageList.slice() : []);
    
    this.SocketService.getChat(this.userInfo.userId, this.receiverId, this.pageValue * 10)
    .subscribe((apiResponse) => {

      console.log(apiResponse);

      if (apiResponse.status == 200) {

        this.messageList = apiResponse.data.concat(previousData);

      } else {

        this.messageList = previousData;
        this.toastr.warning('No Messages available')
      }

      this.loadingPreviousChat = false;

    }, (err) => {

      this.toastr.error('some error occured')


    });

  }// end get previous chat with any user

  public sendMessageUsingKeypress: any = (event: any)=>{
    if(event.keyCode === 13){ // 13 is key code of enter
      this.sendMessage();
    }
  }//sendMessageUsingKeypress


  public loadEarlierPageOfChat: any = () => {

    this.loadingPreviousChat = true;

    this.pageValue++;
    this.scrollToChatTop = true;

    this.getPreviousChatWithAUser() 

  } // end loadPreviousChat

  public userSelectedToChat: any = (id, name) => {

    console.log("setting user as active") 

    // setting that user to chatting true   
    this.userList.map((user)=>{
        if(user.userId==id){
          user.chatting=true;
        }
        else{
          user.chatting = false;
        }
    })

    Cookie.set('receiverId', id);

    Cookie.set('receiverName', name);


    this.receiverName = name;

    this.receiverId = id;

    this.messageList = [];

    this.pageValue = 0;

    let chatDetails = {
      userId: this.userInfo.userId,
      senderId: id
    }


    this.SocketService.markChatAsSeen(chatDetails);

    this.getPreviousChatWithAUser();

  } // end userBtnClick function


  public sendMessage: any = () =>{
    if(this.messageText){
      let chatMsgObject = {
        senderName: this.userInfo.firstName + " " + this.userInfo.lastName,
        senderId: this.userInfo.userId,
        receiverName: Cookie.get('receiverName'),
        receiverId: Cookie.get('receiverId'),
        message: this.messageText,
        createdOn: new Date()
      }//chatMsgObject
      console.log(chatMsgObject);
      this.SocketService.SendChatMessage(chatMsgObject)
      this.pushToChatWindow(chatMsgObject)
    }
    else{
      this.toastr.warning('text message not be empty')
    }
  }//sendMessage end

  public pushToChatWindow: any = (data) =>{
    this.messageText="";
    this.messageList.push(data);
    this.scrollToChatTop = false;

  }//pushToChatWindow

  public logout: any = () => {

    this.appService.logout()
      .subscribe((apiResponse) => {

        if (apiResponse.status === 200) {
          console.log("logout called")
          Cookie.delete('authtoken');

          Cookie.delete('receiverId');

          Cookie.delete('receiverName');

          this.SocketService.exitSocket()

          this.router.navigate(['/']);

        } else {
          this.toastr.error(apiResponse.message)

        } // end condition

      }, (err) => {
        this.toastr.error('some error occured')


      });

  } // end logout

  // handle the output from a child component 

  public showUserName =(name:string)=>{

    this.toastr.success("You are chatting with "+name)

  }

}// class end

