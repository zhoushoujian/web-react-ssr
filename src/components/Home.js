import React from "react";
import { connect } from "react-redux";
import './home.less'
import {storeData} from "../store";

class Home extends React.Component {

    alert1 = () => {
        alert("this is alert")
    }

    componentDidMount(){
        console.log("$getState()", $getState());
        setTimeout(() => {
            window.$dispatch(storeData("GO!!!"))
        },5000)
    }

    render( ) {
        const { text } = this.props;

        return (
            <div className="container">
                <h2>JUST DO WHAT YOU WANT</h2>
                <div onClick={this.alert1}>{text}</div>
            </div>
        );
    }
}


const mapStateToProps = ( state ) => ( {
    text: state.data.textWord,
} );

const mapDispatchToProps = {};

export default connect( mapStateToProps, mapDispatchToProps )( Home );
