import { Injectable } from '@angular/core';
//OBSERVABLE IMPORTING
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';

import * as io from 'socket.io-client';

import {HttpClient,HttpHeaders} from '@angular/common/http';
import {HttpErrorResponse, HttpParams} from '@angular/common/http';
//TOASTR IMPORTING
import { ToastrService } from 'ngx-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private url = 'https://chatapi.edwisor.com';
  private socket;


  constructor(private toastr:ToastrService, private http: HttpClient) {
    //here socket connection is started or handshake 
    this.socket = io(this.url);
   }//constructor end here

  //event to be listened

  public verifyUser = () =>{
    return Observable.create((observer) =>{
      this.socket.on('verifyUsers', (data) => {
        observer.next(data);
      })//end socket
    })//end observable
  }//verifyUser

  public onlineUserList= () => {
    return Observable.create((observer)=>{
      this.socket.on("online-user-list", (userList) => {
        observer.next(userList);
      })//end socket
    })//end observable
  }//onlineUserList end here

  public disconnectedSocket= () => {
    return Observable.create((observer)=>{
      this.socket.on("disconnect", () => {
        observer.next();
      })//end socket
    })//end observable
  }//disconnectedSocket end here

  public getChat(senderId, receiverId, skip): Observable<any>{
    return this.http.get(`${this.url}/api/v1/chat/get/for/user?senderId=${senderId}&recevierId=${receiverId}&skip=${skip}&authToken=${Cookie.get('authThoken')}`)
    .do(data => console.log('Data Received'))
    .catch(this.handleError);
  }// get chat

  public chatByUserId = (userId) =>{
    return Observable.create((observer)=>{
      this.socket.on("userId", (data) =>{
        observer.next(data);
      })//end socket
    })// end observable
  }// end chatByUserId

  public markChatAsSeen = (userDetails) => {

    this.socket.emit('mark-chat-as-seen', userDetails);

  } // end markChatAsSeen



  // EVENT TO BE EMMITED
  public setUser = (authToken) =>{
    this.socket.on("set-user", authToken); 
  }//setUser

public SendChatMessage = (chatMsgObject) =>{
  this.socket.emit('chat-msg', chatMsgObject)
}//sendChatMessage

public exitSocket = () =>{
  this.socket.disconnect();
}// end exit socket

  private handleError(err: HttpErrorResponse){
    let errorMessage = '';
    if(err.error instanceof Error){
      errorMessage = `An Error Occurred: ${err.error.message}`;
    }else{
      errorMessage = `Server return code: ${err.status}, error message is: ${err.message}`;
    }
  }


}//socketService end here
