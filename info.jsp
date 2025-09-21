GIF89a
<%
    response.setStatus(302);                 
    response.setHeader("Location", "http://127.0.0.1:1337/profile?action=export");
    response.setHeader("Connection", "close");
%>  
