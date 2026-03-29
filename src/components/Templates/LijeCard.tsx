import { Card } from "@telegram-apps/telegram-ui"
import { CardCell } from "@telegram-apps/telegram-ui/dist/components/Blocks/Card/components/CardCell/CardCell"
import React from "react"

const LijeModal=()=>{
    return (
        <Card style={{width: '95%', margin: 'auto', display: 'flex'}}>
  <React.Fragment key=".0">
  <div style={{width: '100%', display: 'flex'}}>
  <CardCell
      style={{width: '40%'}}
      readOnly
      subtitle="Addis Ababa"
    >
      LIje Care
    </CardCell>
    <img
      alt="Dog"
      src="https://i.imgur.com/892vhef.jpeg"
      style={{
        padding: '10px',
        height: 108,
        objectFit: 'cover',
        width: '30%'
      }}
    />
    </div>
  </React.Fragment>
</Card>
    )
}

export default LijeModal;