<ItensView>
  <div>
      <ul>
        <li repeat={this.itens}>{item}</li>
      </ul>
  </div>
  <script>
    this.itens=["neto", "fernando"];

    {function x(){
        var y = 1;
        while(y<10)
         y++;
         return y;
    }}
  </script>
</ItensView>
